/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// A simple llama2 runner that includes preprocessing and post processing logic.
// The module takes in a string as input and emits a string as output.

#pragma once

#include "irunner.h"
#include "stats.h"
#include "text_decoder_runner.h"
#include "text_prefiller.h"
#include "text_token_generator.h"
#include <cstdint>
#include <executorch/extension/module/module.h>
#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <tokenizers-cpp/tokenizers_cpp.h>
#include <unordered_map>

namespace example {

namespace llm = ::executorch::extension::llm;

class Runner : public llm::IRunner {
public:
  explicit Runner(::executorch::extension::Module *module,
                  const std::string &tokenizer_path,
                  bool extended_input_mode = false, float temperature = 0.8f);

  bool is_loaded() const override;
  ::executorch::runtime::Error load() override;
  ::executorch::runtime::Error generate(
      const std::string &prompt,
      const executorch::extension::llm::GenerationConfig &generation_config =
          {},
      std::function<void(const std::string &)> token_callback = {},
      std::function<void(const llm::Stats &)> stats_callback = {}) override;
  ::executorch::runtime::Error warmup(const std::string &prompt);
  void set_extended_input_mode(bool extend_position_input) noexcept;
  void set_count_interval(size_t count_interval);
  void set_time_interval(size_t time_interval);
  void stop() override;
  void reset() override;

  llm::Stats stats_;

private:
  // Helper functions
  int32_t resolve_max_new_tokens(int32_t num_prompt_tokens, int32_t max_seq_len,
                                 int32_t max_context_len,
                                 int32_t max_new_tokens = -1) const;

  // Hyperparameters
  float temperature_;
  bool shouldStop_{false};
  bool extend_position_input_{false};

  // Main model
  ::executorch::extension::Module *module_;

  // Subcomponents
  std::string tokenizer_path_;
  std::unique_ptr<tokenizers::Tokenizer> tokenizer_;
  std::unordered_map<std::string, int64_t> metadata_;
  std::unique_ptr<llm::IOManager> io_manager_;
  std::unique_ptr<llm::TextDecoderRunner> text_decoder_runner_;
  std::unique_ptr<llm::TextPrefiller> text_prefiller_;
  std::unique_ptr<llm::TextTokenGenerator> text_token_generator_;

  // Helper variables
  int64_t pos_ = 0; // The position in KV cache of the input, starting from 0.
};

} // namespace example
