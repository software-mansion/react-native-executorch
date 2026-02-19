/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_decoder_runner.h

#pragma once

#include "constants.h"
#include "text_decoder_runner.h"

namespace executorch {
namespace extension {
namespace llm {

// Extends TextDecoderRunner to use the multi-method PTE layout:
//   token_embedding method  → embeddings
//   text_decoder method     → logits
class MultimodalDecoderRunner : public TextDecoderRunner {
public:
  explicit MultimodalDecoderRunner(Module *module, IOManager *io_manager)
      : TextDecoderRunner(module, io_manager) {}

  // Step: embed single token, then decode.
  inline ::executorch::runtime::Result<::executorch::aten::Tensor>
  step(TensorPtr &tokens, int64_t start_pos) override {
    auto embed_result = module_->execute(kTokenEmbeddingMethod, tokens);
    if (!embed_result.ok()) {
      return embed_result.error();
    }
    return decode((*embed_result)[0], start_pos);
  }

  // Decode an embedding EValue to logits.
  inline ::executorch::runtime::Result<::executorch::aten::Tensor>
  decode(const ::executorch::runtime::EValue &embeddings, int64_t start_pos) {
    auto start_pos_tensor = ::executorch::extension::from_blob(
        &start_pos, {1}, ::executorch::aten::ScalarType::Long);
    auto outputs_result =
        module_->execute(kTextModelMethod, {embeddings, start_pos_tensor});
    if (!outputs_result.ok()) {
      return outputs_result.error();
    }
    auto &outputs = *outputs_result;
    ET_CHECK_MSG(outputs.size() == 1,
                 "Expected 1 output from text_decoder, got %zu",
                 outputs.size());
    ET_CHECK_MSG(outputs[0].isTensor(), "text_decoder output is not a tensor");
    return outputs[0].toTensor();
  }

  inline ::executorch::runtime::Error load() override {
    if (is_method_loaded()) {
      return ::executorch::runtime::Error::Ok;
    }
    ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kTokenEmbeddingMethod));
    ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method(kTextModelMethod));
    return ::executorch::runtime::Error::Ok;
  }

  inline bool is_method_loaded() override {
    return module_->is_method_loaded(kTokenEmbeddingMethod) &&
           module_->is_method_loaded(kTextModelMethod);
  }
};

} // namespace llm
} // namespace extension
} // namespace executorch
