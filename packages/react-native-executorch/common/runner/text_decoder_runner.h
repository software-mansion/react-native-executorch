/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Given inputs, run a text decoder in LLM and return the output.

#pragma once

#include "io_manager.h"
#include "sampler.h"

namespace executorch {
namespace extension {
namespace llm {

// Forward declaration to avoid the include chain
// irunner.h -> stats.h -> util.h -> text_prefiller.h -> text_decoder_runner.h
// which would re-enter this header before TextDecoderRunner is defined.
// The full GenerationConfig definition is required at use sites in
// logits_to_token (header-inline) and the constructor (.cpp), both of which
// transitively include irunner.h via base_llm_runner.h.
struct GenerationConfig;

class TextDecoderRunner {
public:
  // The runner reads sampling parameters from `config` on every call to
  // `logits_to_token`, so updating `config.temperature` (etc.) on the owning
  // BaseLLMRunner takes effect immediately without any sync setter on this
  // class.
  explicit TextDecoderRunner(Module &module, IOManager *io_manager,
                             const GenerationConfig &config);

  virtual ~TextDecoderRunner() = default;

  /**
   * Run LLM text decoder with inputs to generate next token.
   * @param input The input to the LLM Module.
   * @param start_pos The starting position in KV cache of the input in the LLM
   * Module.
   * @return The output of the LLM Module. This will be a tensor of logits.
   */
  virtual ::executorch::runtime::Result<executorch::aten::Tensor>
  step(TensorPtr &input, int64_t start_pos);

  /**
   * Load the Module for text decode purpose.
   * @return The error code.
   */
  virtual ::executorch::runtime::Error load() {
    return module_->load_method("forward");
  }

  /**
   * Check if the required methods in the Module is loaded.
   * @return True if the Module is loaded, false otherwise.
   */
  virtual bool is_method_loaded() {
    return module_->is_method_loaded("forward");
  }

  inline void stop() { should_stop_ = true; }

  /**
   * Sample the next token from the logits tensor using the sampling
   * parameters in `config_`. `recent_tokens` is the prompt-plus-generated
   * window used by the repetition penalty. Defined out-of-line in the cpp
   * so this header doesn't need a complete `GenerationConfig` type.
   */
  int32_t logits_to_token(const executorch::aten::Tensor &logits_tensor,
                          const std::vector<uint64_t> &recent_tokens = {});

protected:
  // Non-owning. The runner (BaseLLMRunner) owns the Module and outlives this.
  Module *module_;
  IOManager *io_manager_;
  bool should_stop_{false};
  // Reference to the owning runner's GenerationConfig. Sampling parameters
  // (temperature/topp/min_p/repetition_penalty) are read fresh on every
  // logits_to_token call, so writes to BaseLLMRunner::config_ take effect
  // immediately with no sync setter.
  const GenerationConfig &config_;
};

} // namespace llm
} // namespace extension
} // namespace executorch

namespace torch {
namespace executor {
// TODO(T197294990): Remove these deprecated aliases once all users have moved
// to the new `::executorch` namespaces.
using ::executorch::extension::llm::TextDecoderRunner;
} // namespace executor
} // namespace torch
