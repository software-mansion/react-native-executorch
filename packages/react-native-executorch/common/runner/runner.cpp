/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 * @lint-ignore-every CLANGTIDY facebook-hte-Deprecated
 */

// A simple llama2 runner that includes preprocessing and post processing logic.
// The module takes in a string as input and emits a string as output.

#include "runner.h"
#include "util.h"
#include <ctime>
#include <fstream>
#include <iostream>
#include <rnexecutorch/data_processing/FileUtils.h>

namespace example {

using ::executorch::extension::Module;
using ::executorch::runtime::Error;
using ::executorch::runtime::Result;

namespace {
static constexpr auto kEnableDynamicShape = "enable_dynamic_shape";
static constexpr auto kEosIds = "get_eos_ids";
static constexpr auto kMaxSeqLen = "get_max_seq_len";
static constexpr auto kMaxContextLen = "get_max_context_len";
static constexpr auto kVocabSize = "get_vocab_size";
static constexpr auto kUseKVCache = "use_kv_cache";
static constexpr auto kUseSDPAWithKVCache = "use_sdpa_with_kv_cache";
} // namespace

Runner::Runner(Module *module, const std::string &tokenizer_path,
               const llm::GenerationConfig &config)
    : config_(config), module_(module), tokenizer_path_(tokenizer_path),
      metadata_({
          {kEnableDynamicShape, false},
          {kMaxSeqLen, 128},
          {kMaxContextLen, 128},
          {kUseKVCache, true},
          {kUseSDPAWithKVCache, false},
      }) {}

bool Runner::is_loaded() const {
  return module_->is_loaded() && tokenizer_ && text_decoder_runner_ &&
         text_prefiller_ && text_token_generator_;
}

Error Runner::load() {
  if (is_loaded()) {
    return Error::Ok;
  }

  ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method("forward"));

  // Load tokenizer.
  auto blob = rnexecutorch::file_utils::loadBytesFromFile(tokenizer_path_);
  tokenizer_ = tokenizers::Tokenizer::FromBlobJSON(blob);

  ET_LOG(Info, "Reading metadata from model");

  auto eos_ids = std::make_unique<std::unordered_set<uint64_t>>();
  metadata_[kVocabSize] = tokenizer_->GetVocabSize();

  // Load model metadata
  const auto method_names =
      ET_UNWRAP(module_->method_names(), "Failed reading method names");
  for (auto &pair : metadata_) {
    const auto &method_name = pair.first;
    auto &value = pair.second;
    if (method_names.count(method_name)) {
      value = ET_UNWRAP(module_->get(method_name))
                  .toScalar()
                  .to<decltype(metadata_)::mapped_type>();
    } else {
      ET_LOG(Info, "Method %s not found, using the default value %" PRId64,
             method_name.c_str(), value);
    }
    ET_LOG(Info, "Metadata: %s = %" PRId64, method_name.c_str(), value);
  }

  // Load EOS token ids
  if (method_names.count(kEosIds)) {
    eos_ids->clear();
    for (const auto &eos_id : ET_UNWRAP(module_->execute(kEosIds))) {
      auto value = eos_id.toScalar().to<int64_t>();
      eos_ids->emplace(value);
      ET_LOG(Info, "eos_id = %" PRId64, value);
    }
  }

  // Determine missing config values
  // If user does not directly specify configuration parameters such as
  // max_seq_len (i.e. leaves them as default values), they are determined by
  // reading the exported model's methods.
  if (config_.max_seq_len < 0)
    config_.max_seq_len = static_cast<int32_t>(metadata_.at(kMaxSeqLen));
  if (config_.max_context_length < 0)
    config_.max_context_length =
        static_cast<int32_t>(metadata_.at(kMaxContextLen));
  if (config_.max_new_tokens < 0)
    config_.max_new_tokens =
        std::min(config_.max_seq_len, config_.max_context_length);
  if (config_.enable_dynamic_shape)
    config_.enable_dynamic_shape =
        static_cast<bool>(metadata_.at(kEnableDynamicShape));
  if (config_.enable_kv_cache)
    config_.enable_kv_cache = static_cast<bool>(metadata_.at(kUseKVCache));

  io_manager_ = std::make_unique<llm::IOManager>(*module_);
  text_decoder_runner_ = std::make_unique<llm::TextDecoderRunner>(
      module_, io_manager_.get(), config_.temperature, config_.topp);
  text_prefiller_ = std::make_unique<llm::TextPrefiller>(
      text_decoder_runner_.get(), config_.enable_kv_cache,
      config_.enable_dynamic_shape, config_.max_seq_len);

  text_token_generator_ = std::make_unique<llm::TextTokenGenerator>(
      tokenizer_.get(), text_decoder_runner_.get(), config_.enable_kv_cache,
      std::move(eos_ids), &stats_);

  return Error::Ok;
}

// Don't print with the same priority during warmup
#define RUNNER_ET_LOG(warmup, format, ...)                                     \
  if (warmup) {                                                                \
    ET_LOG(Debug, format, __VA_ARGS__);                                        \
  } else {                                                                     \
    ET_LOG(Info, format, __VA_ARGS__);                                         \
  }

Error Runner::generate(const std::string &prompt,
                       const llm::GenerationConfig &generation_config,
                       std::function<void(const std::string &)> token_callback,
                       std::function<void(const llm::Stats &)> stats_callback) {
  // Prepare the inputs.
  // Use ones-initialized inputs.
  ET_CHECK_MSG(!prompt.empty(), "Prompt cannot be null");
  if (!is_loaded()) {
    stats_.model_load_start_ms = llm::time_in_ms();
    ET_CHECK_OK_OR_RETURN_ERROR(load());
    stats_.model_load_end_ms = llm::time_in_ms();
  }

  if (generation_config.warming) {
    ET_LOG(Info, "Doing a warmup run...");
  }

  RUNNER_ET_LOG(generation_config.warming,
                "RSS after loading model: %f MiB (0 if unsupported)",
                llm::get_rss_bytes() / 1024.0 / 1024.0);

  // Wrap the token_callback with print function
  std::function<void(const std::string &)> wrapped_callback =
      [token_callback, &generation_config](const std::string &piece) {
        if (!generation_config.warming) {
          llm::safe_printf(piece.c_str());
          fflush(stdout);
        }
        if (token_callback) {
          token_callback(piece);
        }
      };
  // First token time only measures the time it takes to encode the prompt and
  // return a response token.

  stats_.inference_start_ms = llm::time_in_ms();
  shouldStop_ = false;

  // Override main config fields with given generation config if specified
  int32_t max_seq_len = generation_config.max_seq_len >= 0
                            ? generation_config.max_seq_len
                            : config_.max_seq_len;
  int32_t max_context_length = generation_config.max_context_length >= 0
                                   ? generation_config.max_context_length
                                   : config_.max_context_length;
  int32_t new_tokens_limit = generation_config.max_new_tokens >= 0
                                 ? generation_config.max_new_tokens
                                 : config_.max_new_tokens;
  float temperature = generation_config.temperature >= 0.F
                          ? generation_config.temperature
                          : config_.temperature;
  float topp =
      generation_config.topp >= 0.F ? generation_config.topp : config_.topp;

  int64_t context_len_left = static_cast<int64_t>(max_context_length) - pos_;

  std::vector<int32_t> prompt_tokens = tokenizer_->Encode(prompt);
  std::vector<uint64_t> prompt_tokens_uint64(prompt_tokens.begin(),
                                             prompt_tokens.end());

  // encode the (string) prompt into tokens sequence
  int num_prompt_tokens = prompt_tokens.size();

  ET_CHECK_OR_RETURN_ERROR(num_prompt_tokens >= 1, InvalidArgument,
                           "Expected at least 1 prompt token");
  ET_CHECK_OR_RETURN_ERROR(num_prompt_tokens < max_seq_len, InvalidArgument,
                           "num_prompt_tokens %d >= max_context_len %" PRId32
                           ", Max seq length exceeded - please increase max "
                           "seq len value in your export script",
                           num_prompt_tokens, max_seq_len);

  // Determine max_new_tokens using the GenerationConfig's resolve method,
  // then subtract pos_ for max_new_tokens.
  int32_t max_new_tokens = resolve_max_new_tokens(
      num_prompt_tokens, max_seq_len, static_cast<int32_t>(context_len_left),
      new_tokens_limit);

  ET_LOG(Info,
         "Max new tokens resolved: %d, given pos_ %" PRId64
         ", num_prompt_tokens %zu, max_context_len %" PRId64,
         max_new_tokens, pos_, prompt_tokens.size(),
         static_cast<int64_t>(max_context_length));
  ET_CHECK_OR_RETURN_ERROR(max_new_tokens > 0, InvalidArgument,
                           "Max new tokens %d is less than or equal to 0",
                           max_new_tokens);

  // Prefill first
  // Here feed all tokens to the model and get the next predicted token
  // after the prompt. After that we will enter generate loop.

  // print prompts
  if (generation_config.echo) {
    wrapped_callback(prompt);
  }
  auto prefill_res = text_prefiller_->prefill(prompt_tokens_uint64, pos_);
  stats_.first_token_ms = llm::time_in_ms();
  stats_.prompt_eval_end_ms = llm::time_in_ms();
  ET_CHECK_OK_OR_RETURN_ERROR(prefill_res.error());
  uint64_t cur_token = prefill_res.get();

  // print the first token from prefill. No prev_token so use cur_token for it.
  const std::string cur_decoded =
      tokenizer_->Decode(std::vector<int32_t>{static_cast<int32_t>(cur_token)});
  RUNNER_ET_LOG(generation_config.warming,
                "RSS after prompt prefill: %f MiB (0 if unsupported)",
                llm::get_rss_bytes() / 1024.0 / 1024.0);

  // start the main loop
  prompt_tokens_uint64.push_back(cur_token);
  int64_t num_generated_tokens = ET_UNWRAP(text_token_generator_->generate(
      prompt_tokens_uint64, pos_, max_new_tokens - 1, temperature, topp,
      wrapped_callback));

  pos_ += num_generated_tokens;

  stats_.inference_end_ms = llm::time_in_ms();
  if (!generation_config.warming) {
    printf("\n");
  }
  RUNNER_ET_LOG(
      generation_config.warming,
      "RSS after finishing text generation: %f MiB (0 if unsupported)",
      llm::get_rss_bytes() / 1024.0 / 1024.0);

  if (num_generated_tokens == max_new_tokens) {
    RUNNER_ET_LOG(generation_config.warming, "Max new tokens %i reached!",
                  max_new_tokens);
  }

  stats_.num_prompt_tokens = num_prompt_tokens;
  stats_.num_generated_tokens = num_generated_tokens;

  if (generation_config.warming) {
    ET_LOG(Info, "Warmup run finished!");
  } else {
    // Do not print report during warmup
#ifndef TEST_BUILD
    ::executorch::llm::print_report(stats_);
#endif
  }
  if (stats_callback) {
    stats_callback(stats_);
  }

  return Error::Ok;
}

Error Runner::warmup(const std::string &prompt) {
  // Create a GenerationConfig for warmup
  llm::GenerationConfig config{.echo = false, .warming = true};

  // Call generate with the warmup config
  Error err = generate(prompt, config,
                       /*token_callback=*/nullptr,
                       /*stats_callbak=*/nullptr);

  // Reset stats after warmup
  reset();

  return err;
}

void Runner::stop() {
  if (is_loaded()) {
    text_token_generator_->stop();
  } else {
    ET_LOG(Error, "Token generator is not loaded, cannot stop");
  }
}

void Runner::reset() {
  stats_.reset();
  pos_ = 0;
}

void Runner::set_count_interval(size_t count_interval) {
  text_token_generator_->set_count_interval(count_interval);
}

void Runner::set_time_interval(size_t time_interval) {
  text_token_generator_->set_time_interval(time_interval);
}

void Runner::set_temperature(float temperature) noexcept {
  config_.temperature = temperature;
  if (text_decoder_runner_) {
    text_decoder_runner_->set_temperature(temperature);
  }
}

void Runner::set_topp(float topp) noexcept {
  config_.topp = topp;
  if (text_decoder_runner_) {
    text_decoder_runner_->set_topp(topp);
  }
}

int32_t Runner::resolve_max_new_tokens(int32_t num_prompt_tokens,
                                       int32_t max_seq_len,
                                       int32_t max_context_len,
                                       int32_t max_new_tokens) const {
  int32_t result;

  if (max_seq_len == -1 && max_new_tokens == -1) {
    // Both are -1, use max context len minus prompt tokens
    result = max_context_len - num_prompt_tokens;
  } else if (max_seq_len == -1 && max_new_tokens != -1) {
    // Only max_new_tokens is specified
    result = std::min(max_new_tokens, max_context_len - num_prompt_tokens);
  } else if (max_seq_len != -1 && max_new_tokens == -1) {
    // Only seq_len is specified
    result = std::min(max_seq_len, max_context_len) - num_prompt_tokens;
  } else {
    // Both are specified
    result =
        std::min(std::min(max_seq_len, max_context_len) - num_prompt_tokens,
                 max_new_tokens);
  }

  // Ensure result is not negative
  return std::max(0, result);
}

} // namespace example
