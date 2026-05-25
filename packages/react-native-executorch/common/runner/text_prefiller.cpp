/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Given a text prompt, encode it using tokenizer and prefill the KV cache of a
// LLM.

#include "text_prefiller.h"
#include "rnexecutorch/Log.h"
#include <algorithm>

namespace executorch {
namespace extension {
namespace llm {

TextPrefiller::TextPrefiller(TextDecoderRunner *text_decoder_runner,
                             bool use_kv_cache, bool enable_parallel_prefill,
                             int64_t max_seq_len)
    : text_decoder_runner_(text_decoder_runner), use_kv_cache_(use_kv_cache),
      enable_parallel_prefill_(enable_parallel_prefill),
      max_seq_len_(max_seq_len > 0 ? max_seq_len : 128) {
  // Auto-detect static-shape prefill: when `forward` declares input 0 as
  // [1, N] with N>1, we must pad every prefill call to exactly N tokens.
  prefill_static_len_ = text_decoder_runner_->prefill_static_len();
}

::executorch::runtime::Result<uint64_t>
TextPrefiller::prefill(std::vector<uint64_t> &prompt_tokens,
                       int64_t &start_pos) {
  ET_CHECK_MSG(!prompt_tokens.empty(), "Prompt cannot be null");
  if (!text_decoder_runner_->is_method_loaded()) {
    ET_CHECK_OK_OR_RETURN_ERROR(text_decoder_runner_->load());
  }

  // Check if we need to chunk the prompt tokens
  int32_t num_prompt_tokens = prompt_tokens.size();

  // When the PTE's `forward` is static-shape (e.g. [1, 256]), the chunk size
  // is fixed at prefill_static_len_; otherwise fall back to max_seq_len_.
  const int32_t chunk_size = prefill_static_len_ > 0
                                 ? static_cast<int32_t>(prefill_static_len_)
                                 : static_cast<int32_t>(max_seq_len_);

  // If prompt tokens exceed chunk_size, we need to chunk them
  if (num_prompt_tokens > chunk_size) {
    uint64_t cur_token = 0;
    int num_tokens_to_process = 0;

    while (num_tokens_to_process < num_prompt_tokens) {
      auto num_tokens_to_prefill_with =
          std::min<int>(num_prompt_tokens - num_tokens_to_process, chunk_size);

      std::vector<uint64_t> prompt_tokens_to_process(
          num_tokens_to_prefill_with);
      std::copy(prompt_tokens.begin() + num_tokens_to_process,
                prompt_tokens.begin() + num_tokens_to_process +
                    num_tokens_to_prefill_with,
                prompt_tokens_to_process.begin());

      // Process this chunk
      auto chunk_result = prefill_chunk(prompt_tokens_to_process, start_pos);
      ET_CHECK_OK_OR_RETURN_ERROR(chunk_result.error());
      cur_token = chunk_result.get();

      num_tokens_to_process += num_tokens_to_prefill_with;
    }

    return cur_token;
  } else {
    // If prompt tokens don't exceed max_seq_len_, process them directly
    return prefill_chunk(prompt_tokens, start_pos);
  }
}

::executorch::runtime::Result<uint64_t>
TextPrefiller::prefill_chunk(std::vector<uint64_t> &prompt_tokens,
                             int64_t &start_pos) {
  // enable_parallel_prefill_ maybe set even when not using kv cache
  // When kv cache is not used, start pos is ignored
  int32_t num_prompt_tokens = prompt_tokens.size();

  // store the token
  uint64_t cur_token;
  if (enable_parallel_prefill_ || !use_kv_cache_) {
    // Static-shape `forward` (e.g. [1, 256]): pad the prompt chunk to exactly
    // prefill_static_len_ with 0, but only count `num_prompt_tokens` real
    // tokens for sampling/start_pos. Padded slots' KV writes are overwritten
    // by the next prefill chunk or decode step before being attended to.
    std::vector<uint64_t> padded;
    uint64_t *tokens_ptr = prompt_tokens.data();
    int32_t tensor_len = num_prompt_tokens;
    if (prefill_static_len_ > 0 && num_prompt_tokens < prefill_static_len_) {
      padded.assign(prefill_static_len_, 0);
      std::copy(prompt_tokens.begin(), prompt_tokens.end(), padded.begin());
      tokens_ptr = padded.data();
      tensor_len = static_cast<int32_t>(prefill_static_len_);
    }

    auto tokens = from_blob(tokens_ptr, {1, tensor_len},
                            executorch::aten::ScalarType::Long);

    auto outputs_res = text_decoder_runner_->step(tokens, start_pos);

    ET_CHECK_OK_OR_RETURN_ERROR(outputs_res.error());
    ET_LOG(Info, "Prefill token result numel(): %zu",
           outputs_res.get().numel());

    start_pos += num_prompt_tokens; // advance only by REAL tokens
    // Sample from the row corresponding to the last real prompt token.
    cur_token = text_decoder_runner_->logits_to_token(outputs_res.get());
  } else {           // sequential prefill
    int64_t pos = 0; // position in the sequence
    // NOLINTNEXTLINE(facebook-hte-ParameterUncheckedArrayBounds)
    cur_token = prompt_tokens[0];

    // initialize tensor wrappers
    auto tokens =
        from_blob(&cur_token, {1, 1}, executorch::aten::ScalarType::Long);

    // run the first token and get back logits tensor. Assuming the first token
    // is bos so don't callback.
    auto logits_result = text_decoder_runner_->step(tokens, start_pos);
    if (!logits_result.ok()) {
      return logits_result.error();
    }
    auto logits_tensor = std::move(*logits_result);

    pos += 1; // start the loop from index 1
    start_pos += 1;

    while (pos < num_prompt_tokens) {
      // Run the model
      // NOLINTNEXTLINE(facebook-hte-ParameterUncheckedArrayBounds)
      cur_token = prompt_tokens[pos];

      logits_tensor = ET_UNWRAP(text_decoder_runner_->step(tokens, start_pos));

      pos++;
      start_pos++;
    }

    cur_token = text_decoder_runner_->logits_to_token(logits_tensor);
  }
  return cur_token;
}

} // namespace llm
} // namespace extension
} // namespace executorch
