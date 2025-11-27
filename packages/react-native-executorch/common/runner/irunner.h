/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Interface for text generation runners.

#pragma once

#include "stats.h"

#include <cstdint>
#include <functional>
#include <memory>
#include <string>

#include <executorch/runtime/core/error.h>

namespace executorch {
namespace extension {
namespace llm {

// Configuration struct for generation parameters
struct GenerationConfig {
  // Whether to echo the input prompt in the output
  bool echo = false;

  // Whether this is a warmup run (affects perf benchmarking)
  bool warming = false;

  // Maximum number of new tokens to generate
  // If the max_context_len metadata that's serialized in the .pte file exists,
  // then the number of prompt tokens + max_new_tokens won't exceed
  // max_context_len. If this field is -1, it means we will rely on
  // max_context_len metadata and seq_len value.
  int32_t max_new_tokens = -1;

  // Maximum number of total tokens
  // If the .pte file contains the max_context_len metadata, it will override
  // this value if it's smaller. If this field is -1, we will use the
  // max_context_len metadata directly.
  int32_t max_seq_len = -1;

  // Maximum context length
  // If the .pte file contains the max_context_len metadata, it will override
  // this value if it's smaller. If this field is -1, we will use the
  // max_context_len metadata directly.
  int32_t max_context_length = -1;

  // Temperature for sampling (higher = more random)
  float temperature = -1.F;

  // Top-p (nucleus sampling) – limits next token selection to the smallest set
  // whose cumulative probability exceeds topp. Range: 0.0 to 1.0. Lower values
  // = more deterministic, higher = more diverse generations.
  float topp = -1.F;

  // Enable dynamic input shapes (if implemented) or not
  // Impacts the prefill phase and causes TextPrefiller to pass all the tokens
  // at once if set to true.
  bool enable_dynamic_shape = true;

  // Use KV_CACHE implementation (if implemented) or not
  bool enable_kv_cache = true;
};

// Base interface for LLM runners
class ET_EXPERIMENTAL IRunner {
public:
  virtual ~IRunner() = default;

  /**
   * Check if the runner is loaded and ready for inference.
   *
   * @return true if the runner is loaded, false otherwise
   */
  virtual bool is_loaded() const = 0;

  /**
   * Load the model and prepare for inference.
   *
   * @return Error::Ok if successful, an error otherwise
   */
  virtual runtime::Error load() = 0;

  /**
   * Generate text based on the provided prompt and generation config.
   *
   * @param prompt The input prompt to generate from
   * @param config Generation configuration parameters
   * @param token_callback Callback function called for each generated token
   * @param stats_callback Callback function for generation statistics
   * @return Error::Ok if successful, an error otherwise
   */
  virtual runtime::Error
  generate(const std::string &prompt, const GenerationConfig &config,
           std::function<void(const std::string &)> token_callback,
           std::function<void(const Stats &)> stats_callback) = 0;

  /**
   * Stop the generation process.
   */
  virtual void stop() = 0;

  /**
   * Force remove prefilled tokens and reset KV cache start position
   *
   * This method removes the prefilled tokens from the KV cache and resets the
   * start position to 0.
   */
  virtual void reset() = 0;
};

} // namespace llm
} // namespace extension
} // namespace executorch
