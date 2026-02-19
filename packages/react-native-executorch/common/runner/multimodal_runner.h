/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_runner.h

#pragma once

#include "multimodal_decoder_runner.h"
#include "multimodal_input.h"
#include "multimodal_prefiller.h"
#include "stats.h"
#include "text_token_generator.h"
#include <executorch/extension/module/module.h>
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

namespace executorch {
namespace extension {
namespace llm {

class MultimodalRunner {
public:
  explicit MultimodalRunner(
      std::unordered_map<std::string, int64_t> metadata,
      std::unique_ptr<tokenizers::HFTokenizer> tokenizer,
      std::unique_ptr<Module> module,
      std::unique_ptr<MultimodalDecoderRunner> decoder_runner,
      std::unique_ptr<MultimodalPrefiller> prefiller,
      std::unique_ptr<IOManager> io_manager,
      std::unique_ptr<TextTokenGenerator> token_generator,
      std::unique_ptr<Stats> stats);

  bool is_loaded();
  ::executorch::runtime::Error load();

  ::executorch::runtime::Error
  generate(const std::vector<MultimodalInput> &inputs, float temperature,
           float topp, int32_t max_new_tokens,
           std::function<void(const std::string &)> token_callback = {});

  void stop();
  void reset();

  Stats &stats() { return *stats_; }

private:
  std::unordered_map<std::string, int64_t> metadata_;
  std::unique_ptr<tokenizers::HFTokenizer> tokenizer_;
  std::unique_ptr<Module> module_;
  std::unique_ptr<MultimodalDecoderRunner> decoder_runner_;
  std::unique_ptr<MultimodalPrefiller> prefiller_;
  std::unique_ptr<IOManager> io_manager_;
  std::unique_ptr<TextTokenGenerator> token_generator_;
  std::unique_ptr<Stats> stats_;
  int64_t pos_ = 0;
};

} // namespace llm
} // namespace extension
} // namespace executorch
