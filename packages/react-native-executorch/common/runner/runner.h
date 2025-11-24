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

class Runner : public executorch::extension::llm::IRunner {
public:
  explicit Runner(::executorch::extension::Module *module,
                  const std::string &tokenizer_path,
                  bool extended_input_mode = false, float temperature = 0.8f,
                  std::optional<const std::string> data_path = std::nullopt);

  bool is_loaded() const override;
  ::executorch::runtime::Error load() override;
  ::executorch::runtime::Error
  generate(const std::string &prompt,
           const executorch::extension::llm::GenerationConfig
               &generation_config = {},
           std::function<void(const std::string &)> token_callback = {},
           std::function<void(const ::executorch::extension::llm::Stats &)>
               stats_callback = {}) override;
  ::executorch::runtime::Error warmup(const std::string &prompt);
  void set_extended_input_mode(bool extend_position_input) noexcept;
  void set_count_interval(size_t count_interval);
  void set_time_interval(size_t time_interval);
  void stop() override;
  void reset() override;

  ::executorch::extension::llm::Stats stats_;

private:
  float temperature_;
  bool extend_position_input_{false};
  bool shouldStop_{false};

  // Main model
  ::executorch::extension::Module *module_;

  // Subcomponents
  std::string tokenizer_path_;
  std::unique_ptr<tokenizers::Tokenizer> tokenizer_;
  std::unordered_map<std::string, int64_t> metadata_;
  std::unique_ptr<::executorch::extension::llm::IOManager> io_manager_;
  std::unique_ptr<::executorch::extension::llm::TextDecoderRunner>
      text_decoder_runner_;
  std::unique_ptr<::executorch::extension::llm::TextPrefiller> text_prefiller_;
  std::unique_ptr<::executorch::extension::llm::TextTokenGenerator>
      text_token_generator_;
};

} // namespace example
