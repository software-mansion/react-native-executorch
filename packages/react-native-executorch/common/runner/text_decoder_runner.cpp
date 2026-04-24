/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Given inputs, run a text decoder and return logits.

#include "text_decoder_runner.h"
#include "arange_util.h"
#include "irunner.h"
#include "stats.h"

#include <ctime>

namespace executorch {
namespace extension {
namespace llm {

// NOTE: we observed ~2x loading performance increase on iPhone 15
// and a ~5% improvement on Galaxy S22 by switching to
// FileDataLoader instead of MmapDataLoader + UseMlockIgnoreErrors.
TextDecoderRunner::TextDecoderRunner(Module &module, IOManager *io_manager,
                                     const GenerationConfig &config)
    : module_(&module), io_manager_(io_manager), config_(config) {}

// This function is functional, meaning it shouldn't modify any state of the
// input. It should be safe to call multiple times with the same inputs. The
// outer loop (call site) is responsible for managing state.
::executorch::runtime::Result<executorch::aten::Tensor>
TextDecoderRunner::step(TensorPtr &tokens, int64_t start_pos) {
  // ET_LOG(Info, "Input token %" PRIu64, input_token);
  auto method_meta_result = module_->method_meta("forward");
  if (!method_meta_result.ok()) {
    return method_meta_result.error();
  }
  auto method_meta = std::move(*method_meta_result);
  // If only 1 input, we are not using kv cache
  bool use_kv_cache = method_meta.num_inputs() > 1;

  std::vector<int64_t> cache_positions;

  if (use_kv_cache) {
    auto start_pos_tensor_result = populate_start_pos_or_cache_position(
        module_, start_pos, cache_positions, tokens->numel(), "forward");
    if (!start_pos_tensor_result.ok()) {
      return start_pos_tensor_result.error();
    }
    auto start_pos_tensor = std::move(*start_pos_tensor_result);

    std::vector<runtime::EValue> inputs;
    auto inputs_res = io_manager_->prepare_decode(tokens, start_pos_tensor);
    ET_CHECK_OK_OR_RETURN_ERROR(inputs_res.error());
    inputs = inputs_res.get();
    auto outputs_res = module_->forward(inputs);
    ET_CHECK_OK_OR_RETURN_ERROR(outputs_res.error());

    auto update_err = io_manager_->update_decode(outputs_res.get());
    ET_CHECK_OK_OR_RETURN_ERROR(update_err);

    ET_CHECK_MSG(outputs_res.get().size() == 1,
                 "More then one output returned from executing LLM.");
    ET_CHECK_MSG(outputs_res.get()[0].isTensor(),
                 "Non Tensor Output returned from executing LLM");

    // Return the logits tensor
    return outputs_res.get()[0].toTensor();
  } else {           // no kv cache
    (void)start_pos; // unused

    auto outputs_res = module_->forward(tokens);
    ET_CHECK_OK_OR_RETURN_ERROR(outputs_res.error());
    ET_CHECK_MSG(outputs_res.get().size() == 1,
                 "More then one output returned from executing LLM.");
    ET_CHECK_MSG(outputs_res.get()[0].isTensor(),
                 "Non Tensor Output returned from executing LLM");

    // Return the logits tensor
    return outputs_res.get()[0].toTensor();
  }
}

int32_t TextDecoderRunner::logits_to_token(
    const executorch::aten::Tensor &logits_tensor,
    const std::vector<uint64_t> &recent_tokens) {
  int32_t result = 0;

  struct {
    [[noreturn]] void fail(torch::executor::Error) {
      ET_CHECK_MSG(false, "Unsupported dtype in logits_to_token");
    }
  } ctx;

  ET_SWITCH_FOUR_TYPES(
      Float, Half, BFloat16, UInt16, logits_tensor.scalar_type(), ctx,
      "logits_to_token", CTYPE, [&]() {
        auto *logits = logits_tensor.mutable_data_ptr<CTYPE>();
        ssize_t vocab_size = logits_tensor.size(logits_tensor.dim() - 1);
        if (logits_tensor.dim() == 3) {
          auto num_tokens = logits_tensor.size(1);
          logits += (num_tokens - 1) * vocab_size;
        }
        Sampler sampler(vocab_size, config_.temperature, config_.topp,
                        static_cast<unsigned long long>(std::time(nullptr)),
                        config_.min_p, config_.repetition_penalty);
        result = sampler.sample(logits, recent_tokens);
      });
  return result;
}

} // namespace llm
} // namespace extension
} // namespace executorch
