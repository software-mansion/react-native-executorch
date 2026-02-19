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

namespace executorch {
namespace extension {
namespace llm {

// Prefills all multimodal inputs (image + text segments) into the KV cache.
// Implements the same padding logic as the ET repo's multimodal_prefiller.cpp.
class MultimodalPrefiller {
public:
  explicit MultimodalPrefiller(Module *module,
                               MultimodalDecoderRunner *decoder_runner,
                               tokenizers::HFTokenizer *tokenizer,
                               IOManager *io_manager);

  // Prefill one input segment. Updates start_pos in-place.
  // Returns the first predicted token after this segment.
  ::executorch::runtime::Result<uint64_t> prefill(const MultimodalInput &input,
                                                  int64_t &start_pos);

  ::executorch::runtime::Error load();
  bool is_method_loaded();

private:
  Module *module_;
  MultimodalDecoderRunner *decoder_runner_;
  tokenizers::HFTokenizer *tokenizer_;
  IOManager *io_manager_;
};

} // namespace llm
} // namespace extension
} // namespace executorch
