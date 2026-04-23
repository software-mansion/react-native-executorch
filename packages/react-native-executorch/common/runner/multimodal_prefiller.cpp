/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_prefiller.cpp
// with our token-embedding padding fix and LFM2-VL adaptations.
//
// Supports two PTE shapes, selected from MultimodalDecoderRunner::uses_ple()
// (auto-detected at load time):
//   * Legacy  : token_embedding -> inputs_embeds;
//               text_decoder(inputs_embeds, cache_positions).
//   * PLE     : token_embedding -> (inputs_embeds, ple_tok);
//               text_decoder(inputs_embeds, ple_tok, cache_positions).

#include "multimodal_prefiller.h"
#include "constants.h"
#include "util.h"
#include <algorithm>
#include <cstring>
#include <rnexecutorch/Log.h>

namespace executorch::extension::llm {

using ::executorch::aten::SizesType;
using ::executorch::runtime::Error;
using ::executorch::runtime::EValue;
using ::executorch::runtime::Result;

MultimodalPrefiller::MultimodalPrefiller(
    Module &module, MultimodalDecoderRunner &decoder_runner,
    tokenizers::HFTokenizer &tokenizer, IEncoder *image_encoder)
    : module_(&module), decoder_runner_(&decoder_runner),
      tokenizer_(&tokenizer), image_encoder_(image_encoder) {}

Result<uint64_t>
MultimodalPrefiller::prefill(const std::vector<MultimodalInput> &inputs,
                             int64_t &start_pos) {
  const bool uses_ple = decoder_runner_->uses_ple();
  const long t_prefill_begin = time_in_ms();

  ET_CHECK_OR_RETURN_ERROR(!inputs.empty(), InvalidArgument,
                           "prefill: empty input list");

  // Required for PLE PTEs: token_embedding has a fixed (1, MAX_SEQ_LEN) input
  // shape. For non-PLE models we'll fall back to no padding.
  int64_t max_seq_len = -1;
  auto max_seq_len_result = module_->get(kMaxSeqLen);
  if (max_seq_len_result.error() == Error::Ok) {
    max_seq_len = max_seq_len_result->toScalar().to<int64_t>();
  }

  // ------------------------------------------------------------
  // Pass 1: build a fused input_ids buffer spanning all inputs.
  //
  // Mirrors gemma_export/experiments/infer_image.py::prefill_single_shot:
  //   llm_ids = prefix_ids + [0] * num_soft + suffix_ids
  // Image positions use pad_token_id=0, matching HF modeling_gemma4.py:2190
  // (placeholder_id is rewritten to 0 before PLE lookup). The decoder embeds
  // at those positions are then overwritten with the vision encoder output
  // in pass 2.
  // ------------------------------------------------------------
  struct ImageSlot {
    const MultimodalInput *input; // non-owning, valid for duration of call
    int64_t slot_start;
    int64_t num_visual;
  };

  std::vector<int64_t> ids;
  ids.reserve(static_cast<size_t>(max_seq_len > 0 ? max_seq_len : 512));
  std::vector<ImageSlot> image_slots;

  for (const auto &input : inputs) {
    if (input.is_image()) {
      ET_CHECK_OR_RETURN_ERROR(image_encoder_ != nullptr, InvalidState,
                               "No image encoder registered");
      const int32_t num_visual = image_encoder_->encoderTokenCount();
      ET_CHECK_OR_RETURN_ERROR(num_visual > 0, InvalidState,
                               "Image encoder reports 0 visual tokens");
      image_slots.push_back(ImageSlot{&input, static_cast<int64_t>(ids.size()),
                                      static_cast<int64_t>(num_visual)});
      ids.insert(ids.end(), static_cast<size_t>(num_visual), 0);
    } else if (input.is_text() || input.is_tokens()) {
      std::vector<uint64_t> tokens;
      if (input.is_text()) {
        auto encode_result = tokenizer_->encode(input.get_text());
        if (!encode_result.ok()) {
          ET_LOG(Error, "Tokenizer encode error %d",
                 static_cast<uint32_t>(encode_result.error()));
          return Error::InvalidArgument;
        }
        tokens = std::move(*encode_result);
      } else {
        tokens = input.get_tokens();
      }
      for (auto t : tokens) {
        ids.push_back(static_cast<int64_t>(t));
      }
    } else {
      ET_LOG(Error, "Unsupported MultimodalInput type");
      return Error::NotSupported;
    }
  }

  const int64_t total_len = static_cast<int64_t>(ids.size());
  ET_CHECK_OR_RETURN_ERROR(total_len > 0, InvalidArgument,
                           "prefill produced zero tokens");

  if (max_seq_len > 0) {
    ET_CHECK_OR_RETURN_ERROR(
        total_len <= max_seq_len, InvalidArgument,
        "Prefill length %lld exceeds token_embedding MAX_SEQ_LEN (%lld)",
        static_cast<long long>(total_len), static_cast<long long>(max_seq_len));
    ids.resize(static_cast<size_t>(max_seq_len),
               0); // pad for fixed-shape input
  }

  // ------------------------------------------------------------
  // Single token_embedding call over the fused id buffer.
  // ------------------------------------------------------------
  const int64_t tok_buf_len = static_cast<int64_t>(ids.size());
  auto token_tensor = ::executorch::extension::from_blob(
      ids.data(), {1, static_cast<SizesType>(tok_buf_len)},
      ::executorch::aten::ScalarType::Long);

  const long t_tokembed_begin = time_in_ms();
  auto embed_result = module_->execute(kTokenEmbeddingMethod, token_tensor);
  ET_CHECK_OK_OR_RETURN_ERROR(embed_result.error());
  auto &embed_outputs = *embed_result;
  const long t_tokembed_end = time_in_ms();

  const size_t expected_outputs = uses_ple ? 2u : 1u;
  ET_CHECK_OR_RETURN_ERROR(embed_outputs.size() == expected_outputs,
                           InvalidState,
                           "Expected %zu output(s) from token_embedding, "
                           "got %zu",
                           expected_outputs, embed_outputs.size());

  auto full_embed = embed_outputs[0].toTensor();
  const auto hidden = static_cast<SizesType>(full_embed.size(2));

  // Own the embeds for the live prefix — subsequent vision_encoder.execute
  // calls may reuse the token_embedding output buffer in the runtime.
  std::vector<float> embeds_buf(static_cast<size_t>(total_len) *
                                static_cast<size_t>(hidden));
  std::memcpy(embeds_buf.data(), full_embed.mutable_data_ptr<float>(),
              embeds_buf.size() * sizeof(float));

  // Own the ple_tok prefix similarly. Dtype is whatever the exporter chose
  // (commonly bf16/int8); we copy bytes through nbytes/numel without
  // assuming the scalar type.
  std::vector<uint8_t> ple_tok_buf;
  SizesType num_layers = 0;
  SizesType ple_dim = 0;
  ::executorch::aten::ScalarType ple_tok_dtype =
      ::executorch::aten::ScalarType::Float;
  if (uses_ple) {
    auto full_ple_tok = embed_outputs[1].toTensor();
    num_layers = static_cast<SizesType>(full_ple_tok.size(2));
    ple_dim = static_cast<SizesType>(full_ple_tok.size(3));
    ple_tok_dtype = full_ple_tok.scalar_type();
    const size_t total_numel = static_cast<size_t>(full_ple_tok.numel());
    const size_t total_bytes = full_ple_tok.nbytes();
    ET_CHECK_OR_RETURN_ERROR(total_numel > 0, InvalidState,
                             "ple_tok has zero elements");
    const size_t elem_size = total_bytes / total_numel;
    const size_t prefix_bytes = static_cast<size_t>(total_len) *
                                static_cast<size_t>(num_layers) *
                                static_cast<size_t>(ple_dim) * elem_size;
    ple_tok_buf.resize(prefix_bytes);
    std::memcpy(ple_tok_buf.data(), full_ple_tok.mutable_data_ptr(),
                prefix_bytes);
  }

  // ------------------------------------------------------------
  // Pass 2: encode images and splice their outputs into embeds_buf.
  // ------------------------------------------------------------
  long vision_total_ms = 0;
  int vision_calls = 0;
  for (const auto &slot : image_slots) {
    const long t_vis_begin = time_in_ms();
    auto encode_result = image_encoder_->encode(*slot.input);
    ET_CHECK_OK_OR_RETURN_ERROR(encode_result.error(), "Image encoding failed");
    auto vision_tensor = encode_result->toTensor();
    vision_total_ms += time_in_ms() - t_vis_begin;
    vision_calls += 1;
    ET_CHECK_OR_RETURN_ERROR(
        static_cast<int64_t>(vision_tensor.size(1)) == slot.num_visual,
        InvalidState, "vision encoder returned %lld tokens, expected %lld",
        static_cast<long long>(vision_tensor.size(1)),
        static_cast<long long>(slot.num_visual));
    ET_CHECK_OR_RETURN_ERROR(
        static_cast<int64_t>(vision_tensor.size(2)) ==
            static_cast<int64_t>(hidden),
        InvalidState, "vision encoder hidden %lld != text_embed hidden %lld",
        static_cast<long long>(vision_tensor.size(2)),
        static_cast<long long>(hidden));

    const float *src = vision_tensor.const_data_ptr<float>();
    float *dst = embeds_buf.data() + static_cast<size_t>(slot.slot_start) *
                                         static_cast<size_t>(hidden);
    std::memcpy(dst, src,
                static_cast<size_t>(slot.num_visual) *
                    static_cast<size_t>(hidden) * sizeof(float));
  }

  // ------------------------------------------------------------
  // Single text_decoder call over the fused embeds + ple_tok.
  // ------------------------------------------------------------
  auto embeds_tensor = ::executorch::extension::from_blob(
      embeds_buf.data(), {1, static_cast<SizesType>(total_len), hidden},
      ::executorch::aten::ScalarType::Float);

  TensorPtr ple_tok_tensor;
  if (uses_ple) {
    ple_tok_tensor = ::executorch::extension::from_blob(
        ple_tok_buf.data(),
        {1, static_cast<SizesType>(total_len), num_layers, ple_dim},
        ple_tok_dtype);
  }

  std::vector<int64_t> cache_positions;
  // text_decoder input layout:
  //   legacy : (inputs_embeds, cache_positions)            -> slot 1
  //   PLE    : (inputs_embeds, ple_tok, cache_positions)   -> slot 2
  const size_t pos_input_index = uses_ple ? 2u : 1u;
  auto cache_pos_result = populate_start_pos_or_cache_position(
      module_, start_pos, cache_positions, static_cast<int>(total_len),
      kTextModelMethod, pos_input_index);
  ET_CHECK_OK_OR_RETURN_ERROR(cache_pos_result.error());

  const long t_textdec_begin = time_in_ms();
  auto prefill_result =
      uses_ple ? module_->execute(kTextModelMethod,
                                  {EValue(*embeds_tensor),
                                   EValue(*ple_tok_tensor), *cache_pos_result})
               : module_->execute(kTextModelMethod,
                                  {EValue(*embeds_tensor), *cache_pos_result});
  ET_CHECK_OK_OR_RETURN_ERROR(prefill_result.error());
  const long t_textdec_end = time_in_ms();

  auto &prefill_outputs = *prefill_result;
  ET_CHECK_OR_RETURN_ERROR(!prefill_outputs.empty(), InvalidState,
                           "text_decoder returned no outputs during prefill");

  auto logits = prefill_outputs[0].toTensor();
  const long t_logits_end = time_in_ms();
  start_pos += total_len;

  const long prefill_total = t_logits_end - t_prefill_begin;
  const long tokembed_ms = t_tokembed_end - t_tokembed_begin;
  const long textdec_ms = t_textdec_end - t_textdec_begin;
  const long sample_ms = t_logits_end - t_textdec_end;
  const long overhead_ms =
      prefill_total - tokembed_ms - vision_total_ms - textdec_ms - sample_ms;
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "prefill splits ms: total=", prefill_total,
                    " token_embed=", tokembed_ms, " vision(x", vision_calls,
                    ")=", vision_total_ms, " text_decoder=", textdec_ms,
                    " logits->token=", sample_ms, " overhead=", overhead_ms,
                    " total_len=", total_len);

  return static_cast<uint64_t>(decoder_runner_->logits_to_token(logits));
}

Error MultimodalPrefiller::load() {
  if (is_method_loaded()) {
    return Error::Ok;
  }
  ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kTokenEmbeddingMethod));
  ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kTextModelMethod));

  auto method_names_result = module_->method_names();
  ET_CHECK_OK_OR_RETURN_ERROR(method_names_result.error(),
                              "Failed to get method names");
  const auto &methods = *method_names_result;

  if (methods.find(kVisionEncoderMethod) != methods.end()) {
    ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kVisionEncoderMethod));
  }
  return Error::Ok;
}

bool MultimodalPrefiller::is_method_loaded() {
  auto methods_res = module_->method_names();
  if (methods_res.error() != Error::Ok) {
    return false;
  }
  if (!module_->is_method_loaded(kTokenEmbeddingMethod) ||
      !module_->is_method_loaded(kTextModelMethod)) {
    return false;
  }
  const auto &methods = *methods_res;
  if (methods.find(kVisionEncoderMethod) != methods.end()) {
    return module_->is_method_loaded(kVisionEncoderMethod);
  }
  return true;
}

} // namespace executorch::extension::llm
