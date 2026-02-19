/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_prefiller.cpp
// with our token-embedding padding fix and LFM2-VL adaptations.

#include "multimodal_prefiller.h"
#include "constants.h"
#include "util.h"

namespace executorch {
namespace extension {
namespace llm {

using ::executorch::aten::SizesType;
using ::executorch::runtime::Error;
using ::executorch::runtime::EValue;
using ::executorch::runtime::Result;

MultimodalPrefiller::MultimodalPrefiller(
    Module *module, MultimodalDecoderRunner *decoder_runner,
    tokenizers::HFTokenizer *tokenizer, IOManager *io_manager)
    : module_(module), decoder_runner_(decoder_runner), tokenizer_(tokenizer),
      io_manager_(io_manager) {}

Result<uint64_t> MultimodalPrefiller::prefill(const MultimodalInput &input,
                                              int64_t &start_pos) {
  // Keep backing storage alive for the duration of the prefill call.
  EValue encoder_output;
  std::vector<int64_t> padded_tokens_storage;
  TensorPtr sliced_embed_storage;

  if (input.is_image()) {
    const Image &image = input.get_image();

    // Query input dtype expected by vision_encoder.
    auto method_meta_result = module_->method_meta(kVisionEncoderMethod);
    ET_CHECK_OK_OR_RETURN_ERROR(method_meta_result.error(),
                                "Failed to get method_meta for %s",
                                kVisionEncoderMethod);
    auto &method_meta = *method_meta_result;

    ET_CHECK_OR_RETURN_ERROR(method_meta.num_inputs() > 0, InvalidArgument,
                             "vision_encoder has no inputs");
    auto input_meta_result = method_meta.input_tensor_meta(0);
    ET_CHECK_OK_OR_RETURN_ERROR(input_meta_result.error(),
                                "Cannot get vision_encoder input meta at 0");
    auto expected_dtype = input_meta_result->scalar_type();

    ET_CHECK_OR_RETURN_ERROR(
        expected_dtype == ::executorch::aten::ScalarType::Float &&
            image.is_float(),
        InvalidArgument, "vision_encoder expects float32 image data");

    auto expected_dims = input_meta_result->sizes();
    auto image_tensor_result =
        image.toTensor(/*with_batch=*/expected_dims.size() == 4);
    ET_CHECK_OK_OR_RETURN_ERROR(image_tensor_result.error(),
                                "Failed to convert image to tensor");

    auto image_encoder_result =
        module_->execute(kVisionEncoderMethod, *image_tensor_result);
    ET_CHECK_OK_OR_RETURN_ERROR(image_encoder_result.error());
    encoder_output = (*image_encoder_result)[0];

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

    const auto actual_seq_len = static_cast<SizesType>(tokens.size());

    // The token_embedding PTE has a fixed MAX_SEQ_LEN input buffer.
    // Pad with zeros, run embedding, then slice output back to actual length.
    int64_t max_seq_len = actual_seq_len; // fallback: no padding needed
    auto max_seq_len_result = module_->get(kMaxSeqLen);
    if (max_seq_len_result.error() == Error::Ok) {
      max_seq_len = max_seq_len_result->toScalar().to<int64_t>();
    }

    padded_tokens_storage.assign(max_seq_len, 0);
    std::copy(tokens.begin(), tokens.end(), padded_tokens_storage.begin());

    auto text_tensor = ::executorch::extension::from_blob(
        padded_tokens_storage.data(), {1, static_cast<SizesType>(max_seq_len)},
        ::executorch::aten::ScalarType::Long);

    auto embed_result = module_->execute(kTokenEmbeddingMethod, text_tensor);
    ET_CHECK_OK_OR_RETURN_ERROR(embed_result.error());

    auto full_embed = (*embed_result)[0].toTensor();
    const auto embed_dim = static_cast<SizesType>(full_embed.size(2));
    sliced_embed_storage = ::executorch::extension::from_blob(
        full_embed.mutable_data_ptr(), {1, actual_seq_len, embed_dim},
        ::executorch::aten::ScalarType::Float);
    encoder_output = EValue(*sliced_embed_storage);

  } else {
    ET_LOG(Error, "Unsupported MultimodalInput type");
    return Error::NotSupported;
  }

  // Run text_decoder for prefill.
  int64_t seq_len = encoder_output.toTensor().size(1);
  if (seq_len == 0) {
    ET_LOG(Error, "Encoder returned empty output");
    return Error::InvalidState;
  }

  std::vector<int64_t> cache_positions;
  auto cache_pos_result = populate_start_pos_or_cache_position(
      module_, start_pos, cache_positions, seq_len, kTextModelMethod);
  ET_CHECK_OK_OR_RETURN_ERROR(cache_pos_result.error());

  auto prefill_result =
      module_->execute(kTextModelMethod, {encoder_output, *cache_pos_result});
  ET_CHECK_OK_OR_RETURN_ERROR(prefill_result.error());

  auto &prefill_outputs = *prefill_result;
  ET_CHECK_OR_RETURN_ERROR(!prefill_outputs.empty(), InvalidState,
                           "text_decoder returned no outputs during prefill");

  auto logits = prefill_outputs[0].toTensor();
  start_pos += seq_len;

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

} // namespace llm
} // namespace extension
} // namespace executorch
