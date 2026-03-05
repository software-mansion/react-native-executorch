// common/runner/base_llm_runner.cpp
#include "base_llm_runner.h"
#include "constants.h"
#include <cstdint>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::llm::runner {

using namespace executorch::extension::llm;
using ::executorch::extension::Module;
using ::executorch::runtime::Error;

BaseLLMRunner::BaseLLMRunner(std::unique_ptr<Module> module,
                             const std::string &tokenizer_path,
                             const llm::GenerationConfig &config)
    : config_(config), module_(std::move(module)),
      tokenizer_path_(tokenizer_path),
      tokenizer_(std::make_unique<tokenizers::HFTokenizer>()),
      metadata_({
          {kEnableDynamicShape, false},
          {kMaxSeqLen, 128},
          {kMaxContextLen, 128},
          {kUseKVCache, true},
      }) {}

Error BaseLLMRunner::load() {
  if (is_loaded())
    return Error::Ok;

  auto status = tokenizer_->load(tokenizer_path_);
  if (status != tokenizers::Error::Ok) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while loading tokenizer");
  }

  const auto method_names =
      ET_UNWRAP(module_->method_names(), "Failed reading method names");

  metadata_[kVocabSize] = tokenizer_->vocab_size();
  for (auto &pair : metadata_) {
    const auto &method_name = pair.first;
    auto &value = pair.second;
    if (method_names.count(method_name)) {
      value = ET_UNWRAP(module_->get(method_name))
                  .toScalar()
                  .to<decltype(metadata_)::mapped_type>();
    }
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[BaseLLMRunner] Metadata:", method_name, "=", value);
  }

  if (config_.max_seq_len < 0)
    config_.max_seq_len = static_cast<int32_t>(metadata_.at(kMaxSeqLen));
  if (config_.max_context_length < 0) {
    config_.max_context_length =
        method_names.count(kMaxContextLen)
            ? static_cast<int32_t>(metadata_.at(kMaxContextLen))
            : static_cast<int32_t>(metadata_.at(kMaxSeqLen));
  }
  if (config_.max_new_tokens < 0)
    config_.max_new_tokens =
        std::min(config_.max_seq_len, config_.max_context_length);
  config_.enable_dynamic_shape =
      static_cast<bool>(metadata_.at(kEnableDynamicShape));
  config_.enable_kv_cache = static_cast<bool>(metadata_.at(kUseKVCache));

  eos_ids_ = std::make_unique<std::unordered_set<uint64_t>>();
  if (method_names.count(kEosIds)) {
    for (const auto &eos_id : ET_UNWRAP(module_->execute(kEosIds))) {
      eos_ids_->emplace(static_cast<uint64_t>(eos_id.toScalar().to<int64_t>()));
    }
  }
  if (eos_ids_->empty()) {
    eos_ids_->emplace(7); // fallback <|im_end|>
  }

  io_manager_ = std::make_unique<llm::IOManager>(*module_);

  return load_subcomponents();
}

Error BaseLLMRunner::generate(
    const std::string &prompt, const llm::GenerationConfig &generation_config,
    std::function<void(const std::string &)> token_callback,
    std::function<void(const llm::Stats &)> stats_callback) {

  ET_CHECK_MSG(!prompt.empty(), "Prompt cannot be null");

  std::vector<llm::MultimodalInput> inputs = {llm::make_text_input(prompt)};
  auto err = generate_internal(inputs, token_callback);

  if (stats_callback)
    stats_callback(stats_);

  return err;
}

Error BaseLLMRunner::generate(
    const std::vector<llm::MultimodalInput> &inputs,
    std::function<void(const std::string &)> token_callback,
    std::function<void(const llm::Stats &)> stats_callback) {

  auto err = generate_internal(inputs, token_callback);

  if (stats_callback)
    stats_callback(stats_);

  return err;
}

void BaseLLMRunner::stop() { stop_impl(); }

void BaseLLMRunner::reset() {
  stats_.reset();
  pos_ = 0;
}

int32_t BaseLLMRunner::count_text_tokens(const std::string &text) const {
  auto encodeResult =
      tokenizer_->encode(text, numOfAddedBoSTokens, numOfAddedEoSTokens);
  if (!encodeResult.ok()) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Encoding failed during token count check.");
  }
  return static_cast<int32_t>(encodeResult.get().size());
}

int32_t BaseLLMRunner::get_max_context_length() const {
  if (!is_loaded())
    return static_cast<int32_t>(metadata_.at(kMaxContextLen));
  return config_.max_context_length;
}

void BaseLLMRunner::set_temperature(float temperature) noexcept {
  config_.temperature = temperature;
  set_temperature_impl(temperature);
}

void BaseLLMRunner::set_topp(float topp) noexcept {
  config_.topp = topp;
  set_topp_impl(topp);
}

void BaseLLMRunner::set_count_interval(size_t count_interval) {
  set_count_interval_impl(count_interval);
}

void BaseLLMRunner::set_time_interval(size_t time_interval) {
  set_time_interval_impl(time_interval);
}

int32_t BaseLLMRunner::resolve_max_new_tokens(int32_t num_prompt_tokens,
                                              int32_t max_seq_len,
                                              int32_t max_context_len,
                                              int32_t max_new_tokens) const {
  int32_t result;
  if (max_seq_len == -1 && max_new_tokens == -1)
    result = max_context_len - num_prompt_tokens;
  else if (max_seq_len == -1)
    result = std::min(max_new_tokens, max_context_len - num_prompt_tokens);
  else if (max_new_tokens == -1)
    result = std::min(max_seq_len, max_context_len) - num_prompt_tokens;
  else
    result =
        std::min(std::min(max_seq_len, max_context_len) - num_prompt_tokens,
                 max_new_tokens);
  return std::max(0, result);
}

} // namespace rnexecutorch::llm::runner
