/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_runner.cpp

#include "multimodal_runner.h"
#include "constants.h"
#include "util.h"
#include <rnexecutorch/Error.h>

namespace executorch {
namespace extension {
namespace llm {

using ::executorch::extension::Module;
using ::executorch::runtime::Error;

MultimodalRunner::MultimodalRunner(
    std::unordered_map<std::string, int64_t> metadata,
    std::unique_ptr<tokenizers::HFTokenizer> tokenizer,
    std::unique_ptr<Module> module,
    std::unique_ptr<MultimodalDecoderRunner> decoder_runner,
    std::unique_ptr<MultimodalPrefiller> prefiller,
    std::unique_ptr<IOManager> io_manager,
    std::unique_ptr<TextTokenGenerator> token_generator,
    std::unique_ptr<Stats> stats)
    : metadata_(std::move(metadata)), tokenizer_(std::move(tokenizer)),
      module_(std::move(module)), decoder_runner_(std::move(decoder_runner)),
      prefiller_(std::move(prefiller)), io_manager_(std::move(io_manager)),
      token_generator_(std::move(token_generator)), stats_(std::move(stats)),
      pos_(0) {}

bool MultimodalRunner::is_loaded() {
  return prefiller_->is_method_loaded() && token_generator_->is_loaded();
}

Error MultimodalRunner::load() {
  if (is_loaded()) {
    return Error::Ok;
  }
  ET_CHECK_OK_OR_RETURN_ERROR(prefiller_->load());
  ET_CHECK_OK_OR_RETURN_ERROR(token_generator_->load());
  return Error::Ok;
}

Error MultimodalRunner::generate(
    const std::vector<MultimodalInput> &inputs, float temperature, float topp,
    int32_t max_new_tokens,
    std::function<void(const std::string &)> token_callback) {
  if (inputs.empty()) {
    ET_LOG(Error, "MultimodalInput vector cannot be empty");
    return Error::InvalidArgument;
  }

  if (!is_loaded()) {
    ET_CHECK_OK_OR_RETURN_ERROR(load());
  }

  stats_->inference_start_ms = time_in_ms();

  // Prefill all input segments in order.
  uint64_t prefill_next_token = 0;
  for (size_t i = 0; i < inputs.size(); ++i) {
    ET_LOG(Info, "Prefilling input %zu/%zu", i + 1, inputs.size());
    auto prefill_result = prefiller_->prefill(inputs[i], pos_);
    if (!prefill_result.ok()) {
      return prefill_result.error();
    }
    prefill_next_token = prefill_result.get();
  }

  stats_->first_token_ms = time_in_ms();
  stats_->prompt_eval_end_ms = time_in_ms();
  stats_->num_prompt_tokens = pos_;

  // Decode and emit the first token from prefill.
  auto decode_result =
      tokenizer_->decode(prefill_next_token, prefill_next_token);
  if (!decode_result.ok()) {
    ET_LOG(Error, "Tokenizer decode error %d",
           static_cast<uint32_t>(decode_result.error()));
    return Error::InvalidArgument;
  }
  const std::string first_piece = std::move(*decode_result);
  safe_printf(first_piece.c_str());
  fflush(stdout);
  if (token_callback) {
    token_callback(first_piece);
  }

  // Resolve max_new_tokens from metadata if caller passed -1.
  int64_t context_len = metadata_.count(kMaxContextLen)
                            ? metadata_.at(kMaxContextLen)
                        : metadata_.count(kMaxSeqLen) ? metadata_.at(kMaxSeqLen)
                                                      : 2048;
  int32_t resolved_max_new = max_new_tokens > 0
                                 ? max_new_tokens
                                 : static_cast<int32_t>(context_len - pos_);
  resolved_max_new = std::max(0, resolved_max_new);

  // Autoregressive decode loop.
  std::vector<uint64_t> prompt_tokens = {prefill_next_token};
  auto wrapped_callback = [&](const std::string &piece) {
    safe_printf(piece.c_str());
    fflush(stdout);
    if (token_callback) {
      token_callback(piece);
    }
  };

  auto generate_result = token_generator_->generate(
      prompt_tokens, pos_,
      static_cast<uint64_t>(std::max(0, resolved_max_new - 1)), temperature,
      topp, wrapped_callback);

  if (!generate_result.ok()) {
    return generate_result.error();
  }

  int64_t num_generated = generate_result.get();
  pos_ += num_generated;

  stats_->inference_end_ms = time_in_ms();
  stats_->num_generated_tokens = num_generated;

  return Error::Ok;
}

void MultimodalRunner::stop() {
  if (token_generator_) {
    token_generator_->stop();
  }
}

void MultimodalRunner::reset() {
  pos_ = 0;
  if (stats_) {
    stats_->reset();
  }
}

} // namespace llm
} // namespace extension
} // namespace executorch
