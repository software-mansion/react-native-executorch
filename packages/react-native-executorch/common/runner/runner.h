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

class ET_EXPERIMENTAL Runner : public executorch::extension::llm::IRunner {
public:
  explicit Runner(const std::string &model_path,
                  const std::string &tokenizer_path,
                  const float temperature = 0.8f,
                  std::optional<const std::string> data_path = std::nullopt);

  bool is_loaded() const;
  ::executorch::runtime::Error load();
  ::executorch::runtime::Error
  generate(const std::string &prompt,
           std::function<void(const std::string &)> token_callback = {},
           std::function<void(const ::executorch::extension::llm::Stats &)>
               stats_callback = {},
           bool echo = true, bool warming = false);
  ::executorch::runtime::Error warmup(const std::string &prompt);
  void set_count_interval(size_t count_interval);
  void set_time_interval(size_t time_interval);
  void stop();

  ::executorch::extension::llm::Stats stats_;

private:
  float temperature_;
  bool shouldStop_{false};

  // model
  std::unique_ptr<::executorch::extension::Module> module_;
  std::string tokenizer_path_;
  std::unique_ptr<tokenizers::Tokenizer> tokenizer_;
  std::unordered_map<std::string, int64_t> metadata_;
  std::unique_ptr<::executorch::extension::llm::TextDecoderRunner>
      text_decoder_runner_;
  std::unique_ptr<::executorch::extension::llm::TextPrefiller> text_prefiller_;
  std::unique_ptr<::executorch::extension::llm::TextTokenGenerator>
      text_token_generator_;
};

} // namespace example
