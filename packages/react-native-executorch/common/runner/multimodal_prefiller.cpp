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
#include <algorithm>
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

Result<uint64_t> MultimodalPrefiller::prefill(const MultimodalInput &input,
                                              int64_t &start_pos) {
  EValue encoder_output;
  std::vector<int64_t> padded_tokens_storage;
  TensorPtr sliced_embed_storage;

  std::vector<float> embed_buffer;

  if (input.is_image()) {
    ET_CHECK_OR_RETURN_ERROR(image_encoder_ != nullptr, InvalidState,
                             "No image encoder registered");
    auto encode_result = image_encoder_->encode(input);
    ET_CHECK_OK_OR_RETURN_ERROR(encode_result.error(), "Image encoding failed");
    encoder_output = *encode_result;

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

    // Check if token_embedding supports multiple tokens
    bool supports_parallel_embedding = false;
    int64_t expected_embed_seq_len = 1;
    auto embed_meta_result = module_->method_meta(kTokenEmbeddingMethod);

    if (embed_meta_result.ok()) {
      auto input_meta = embed_meta_result->input_tensor_meta(0);
      if (input_meta.ok() && input_meta->sizes().size() >= 2) {
        expected_embed_seq_len = input_meta->sizes()[1];
        if (expected_embed_seq_len > 1 || expected_embed_seq_len < 0) {
          supports_parallel_embedding = true;
        }
      }
    }

    if (supports_parallel_embedding) {
      int64_t embed_seq_len = actual_seq_len;
      if (expected_embed_seq_len > 1) {
        embed_seq_len = expected_embed_seq_len;
      }

      padded_tokens_storage.assign(embed_seq_len, 0);
      std::ranges::copy(tokens, padded_tokens_storage.begin());

      auto text_tensor = ::executorch::extension::from_blob(
          padded_tokens_storage.data(),
          {1, static_cast<SizesType>(embed_seq_len)},
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
      SizesType embed_dim = 0;
      for (size_t i = 0; i < actual_seq_len; ++i) {
        int64_t token_val = static_cast<int64_t>(tokens[i]);
        auto text_tensor = ::executorch::extension::from_blob(
            &token_val, {1, 1}, ::executorch::aten::ScalarType::Long);

        auto embed_result =
            module_->execute(kTokenEmbeddingMethod, text_tensor);
        ET_CHECK_OK_OR_RETURN_ERROR(embed_result.error());

        auto single_embed = (*embed_result)[0].toTensor();
        if (embed_dim == 0) {
          embed_dim = static_cast<SizesType>(single_embed.size(2));
          embed_buffer.reserve(actual_seq_len * embed_dim);
        }

        const float *data_ptr = single_embed.const_data_ptr<float>();
        embed_buffer.insert(embed_buffer.end(), data_ptr, data_ptr + embed_dim);
      }

      sliced_embed_storage = ::executorch::extension::from_blob(
          embed_buffer.data(), {1, actual_seq_len, embed_dim},
          ::executorch::aten::ScalarType::Float);

      encoder_output = EValue(*sliced_embed_storage);
    }
  } else {
    ET_LOG(Error, "Unsupported MultimodalInput type");
    return Error::NotSupported;
  }

  // Run text_decoder for prefill.
  auto encoder_tensor = encoder_output.toTensor();
  int64_t seq_len = encoder_tensor.size(1);
  if (seq_len == 0) {
    ET_LOG(Error, "Encoder returned empty output");
    return Error::InvalidState;
  }

  // Check if the model takes input of more than 1 element
  bool supports_parallel = false;
  auto meta_result = module_->method_meta(kTextModelMethod);
  if (meta_result.ok()) {
    auto input_meta = meta_result->input_tensor_meta(0);
    if (input_meta.ok() && input_meta->sizes().size() >= 2) {
      auto expected_seq_len = input_meta->sizes()[1];
      // If expected sequence length is dynamic (-1) or greater than 1
      if (expected_seq_len > 1 || expected_seq_len < 0) {
        supports_parallel = true;
      }
    }
  }

  uint64_t next_token = 0;

  if (supports_parallel) {
    std::vector<int64_t> cache_positions;
    auto cache_pos_result = populate_start_pos_or_cache_position(
        module_, start_pos, cache_positions, seq_len, kTextModelMethod);
    ET_CHECK_OK_OR_RETURN_ERROR(cache_pos_result.error());

    auto prefill_result =
        module_->execute(kTextModelMethod, {encoder_output, *cache_pos_result});

    ET_CHECK_OK_OR_RETURN_ERROR(prefill_result.error());
    ET_CHECK_OR_RETURN_ERROR(
        !prefill_result->empty(), InvalidState,
        "text_decoder returned no outputs during parallel prefill");

    auto logits = (*prefill_result)[0].toTensor();
    next_token = decoder_runner_->logits_to_token(logits);
    start_pos += seq_len;

  } else {
    ET_LOG(Info, "Model expects seq_len=1, falling back to sequential prefill");

    const auto embed_dim = encoder_tensor.size(2);
    uint8_t *data_ptr =
        static_cast<uint8_t *>(encoder_tensor.mutable_data_ptr());
    size_t element_size = encoder_tensor.nbytes() / encoder_tensor.numel();

    for (int64_t pos = 0; pos < seq_len; ++pos) {
      void *step_data_ptr = data_ptr + (pos * embed_dim * element_size);

      auto step_tensor = ::executorch::extension::from_blob(
          step_data_ptr, {1, 1, static_cast<SizesType>(embed_dim)},
          encoder_tensor.scalar_type());

      std::vector<int64_t> step_cache_positions;
      auto step_cache_pos_result = populate_start_pos_or_cache_position(
          module_, start_pos, step_cache_positions, 1, kTextModelMethod);
      ET_CHECK_OK_OR_RETURN_ERROR(step_cache_pos_result.error());

      auto step_result = module_->execute(
          kTextModelMethod, {EValue(*step_tensor), *step_cache_pos_result});

      ET_CHECK_OK_OR_RETURN_ERROR(step_result.error());
      ET_CHECK_OR_RETURN_ERROR(
          !step_result->empty(), InvalidState,
          "text_decoder returned no outputs during sequential prefill");

      auto logits = (*step_result)[0].toTensor();
      next_token = decoder_runner_->logits_to_token(logits);
      start_pos++;
    }
  }

  return next_token;
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
