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

namespace executorch::extension::llm {
// Supports two PTE contracts, selected automatically at load time from
// `token_embedding`'s output arity:
//
//  * Legacy (default):
//      token_embedding(ids) -> inputs_embeds
//      text_decoder(inputs_embeds, input_pos)
//
//  * Gemma-style PLE (when token_embedding emits 2 outputs):
//      token_embedding(ids) -> (inputs_embeds, ple_tok)
//      text_decoder(inputs_embeds, ple_tok, input_pos)
//    ple_tok carries Gemma4's per-layer PLE signal keyed on input_ids. It's
//    computed once in token_embedding and threaded through every decoder call
//    so PLE fires at every position (including multimodal placeholder slots).
class MultimodalDecoderRunner : public TextDecoderRunner {
public:
  explicit MultimodalDecoderRunner(Module &module, IOManager *io_manager)
      : TextDecoderRunner(module, io_manager) {}

  // True iff the loaded PTE uses the Gemma-style PLE contract above.
  // Meaningful only after load() has been called.
  bool uses_ple() const { return uses_ple_; }

  inline ::executorch::runtime::Result<::executorch::aten::Tensor>
  step(TensorPtr &tokens, int64_t start_pos) override {
    auto embed_result = module_->execute(kTokenEmbeddingMethod, tokens);

    if (!embed_result.ok()) {
      return embed_result.error();
    }
    auto &embed_outputs = *embed_result;
    if (uses_ple_) {
      ET_CHECK_MSG(embed_outputs.size() == 2,
                   "Expected 2 outputs (inputs_embeds, ple_tok) from "
                   "token_embedding, got %zu",
                   embed_outputs.size());
      return decode(embed_outputs[0], embed_outputs[1], start_pos);
    }
    return decode(embed_outputs[0], start_pos);
  }

  // Legacy 2-input text_decoder(inputs_embeds, input_pos).
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

  // PLE 3-input text_decoder(inputs_embeds, ple_tok, input_pos).
  inline ::executorch::runtime::Result<::executorch::aten::Tensor>
  decode(const ::executorch::runtime::EValue &embeddings,
         const ::executorch::runtime::EValue &ple_tok, int64_t start_pos) {
    auto start_pos_tensor = ::executorch::extension::from_blob(
        &start_pos, {1}, ::executorch::aten::ScalarType::Long);
    auto outputs_result = module_->execute(
        kTextModelMethod, {embeddings, ple_tok, start_pos_tensor});
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

    auto meta = module_->method_meta(kTokenEmbeddingMethod);
    ET_CHECK_OK_OR_RETURN_ERROR(meta.error());
    uses_ple_ = (meta->num_outputs() == 2);
    return ::executorch::runtime::Error::Ok;
  }

  inline bool is_method_loaded() override {
    return module_->is_method_loaded(kTokenEmbeddingMethod) &&
           module_->is_method_loaded(kTextModelMethod);
  }

private:
  bool uses_ple_ = true;
};

} // namespace executorch::extension::llm
