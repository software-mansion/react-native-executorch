/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_prefiller.h

#pragma once

#include "multimodal_decoder_runner.h"
#include "multimodal_input.h"
#include <executorch/extension/module/module.h>
#include <pytorch/tokenizers/hf_tokenizer.h>
#include <runner/encoders/iencoder.h>

namespace executorch::extension::llm {

class MultimodalPrefiller {
public:
  explicit MultimodalPrefiller(Module &module,
                               MultimodalDecoderRunner &decoder_runner,
                               tokenizers::HFTokenizer &tokenizer,
                               IEncoder *image_encoder = nullptr);

  // Single-shot prefill: fuses all inputs into one token_embedding call and
  // one text_decoder call. Image slots are filled with pad_token_id=0 (HF
  // modeling_gemma4.py behavior); vision encoder output overwrites the embeds
  // at those slots before the decoder runs. Updates start_pos in-place.
  // Returns the first predicted token after the fused prefill.
  ::executorch::runtime::Result<uint64_t>
  prefill(const std::vector<MultimodalInput> &inputs, int64_t &start_pos);

  ::executorch::runtime::Error load();
  bool is_method_loaded();

private:
  Module *module_;
  MultimodalDecoderRunner *decoder_runner_;
  tokenizers::HFTokenizer *tokenizer_;
  IEncoder *image_encoder_;
};

} // namespace executorch::extension::llm
