// packages/react-native-executorch/common/runner/unified_runner.cpp
#include "unified_runner.h"
#include "constants.h"
#include "util.h"
#include <cstdint>
#include <ctime>
#include <rnexecutorch/Error.h>

namespace example {

using namespace executorch::extension::llm;
using ::executorch::extension::Module;
using ::executorch::runtime::Error;
using ::executorch::runtime::Result;

UnifiedRunner::UnifiedRunner(Module *module,
                             std::unique_ptr<Module> owned_module,
                             const std::string &tokenizer_path,
                             const llm::GenerationConfig &config)
    : config_(config), module_(owned_module ? owned_module.get() : module),
      owned_module_(std::move(owned_module)), tokenizer_path_(tokenizer_path),
      tokenizer_(std::make_unique<tokenizers::HFTokenizer>()),
      metadata_({
          {kEnableDynamicShape, false},
          {kMaxSeqLen, 128},
          {kMaxContextLen, 128},
          {kUseKVCache, true},
          {kUseSDPAWithKVCache, false},
      }) {}

bool UnifiedRunner::is_multimodal() const noexcept { return multimodal_; }

bool UnifiedRunner::is_loaded() const {
  if (multimodal_) {
    return mm_prefiller_ && mm_prefiller_->is_method_loaded() &&
           mm_token_generator_ && mm_token_generator_->is_loaded();
  }
  return module_->is_loaded() && tokenizer_->is_loaded() &&
         text_decoder_runner_ && text_prefiller_ && text_token_generator_;
}

Error UnifiedRunner::load() {
  if (is_loaded()) {
    return Error::Ok;
  }

  auto status = tokenizer_->load(tokenizer_path_);
  if (status != tokenizers::Error::Ok) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while loading tokenizer");
  }

  // Detect mode by inspecting method names
  const auto method_names =
      ET_UNWRAP(module_->method_names(), "Failed reading method names");

  multimodal_ = method_names.count(kTokenEmbeddingMethod) > 0 &&
                method_names.count(kTextModelMethod) > 0;

  // Load metadata
  metadata_[kVocabSize] = tokenizer_->vocab_size();
  for (auto &pair : metadata_) {
    const auto &method_name = pair.first;
    auto &value = pair.second;
    if (method_names.count(method_name)) {
      value = ET_UNWRAP(module_->get(method_name))
                  .toScalar()
                  .to<decltype(metadata_)::mapped_type>();
    }
    ET_LOG(Info, "Metadata: %s = %" PRId64, method_name.c_str(), value);
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
  if (config_.enable_dynamic_shape)
    config_.enable_dynamic_shape =
        static_cast<bool>(metadata_.at(kEnableDynamicShape));
  if (config_.enable_kv_cache)
    config_.enable_kv_cache = static_cast<bool>(metadata_.at(kUseKVCache));

  // Load EOS ids
  auto eos_ids = std::make_unique<std::unordered_set<uint64_t>>();
  if (method_names.count(kEosIds)) {
    for (const auto &eos_id : ET_UNWRAP(module_->execute(kEosIds))) {
      eos_ids->emplace(static_cast<uint64_t>(eos_id.toScalar().to<int64_t>()));
    }
  }
  if (eos_ids->empty()) {
    eos_ids->emplace(7); // fallback <|im_end|>
  }

  io_manager_ = std::make_unique<llm::IOManager>(*module_);
  llm::Stats *stats_ptr = &stats_;

  if (multimodal_) {
    mm_decoder_runner_ = std::make_unique<llm::MultimodalDecoderRunner>(
        module_, io_manager_.get());
    mm_prefiller_ = std::make_unique<llm::MultimodalPrefiller>(
        module_, mm_decoder_runner_.get(), tokenizer_.get(), io_manager_.get());
    mm_token_generator_ = std::make_unique<llm::TextTokenGenerator>(
        tokenizer_.get(), mm_decoder_runner_.get(), /*use_kv_cache=*/true,
        std::move(eos_ids), stats_ptr);

    ET_CHECK_OK_OR_RETURN_ERROR(mm_prefiller_->load());
    ET_CHECK_OK_OR_RETURN_ERROR(mm_token_generator_->load());
  } else {
    ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method("forward"));

    text_decoder_runner_ = std::make_unique<llm::TextDecoderRunner>(
        module_, io_manager_.get(), config_.temperature, config_.topp);
    text_prefiller_ = std::make_unique<llm::TextPrefiller>(
        text_decoder_runner_.get(), config_.enable_kv_cache,
        config_.enable_dynamic_shape, config_.max_seq_len);
    text_token_generator_ = std::make_unique<llm::TextTokenGenerator>(
        tokenizer_.get(), text_decoder_runner_.get(), config_.enable_kv_cache,
        std::move(eos_ids), stats_ptr);
  }

  return Error::Ok;
}

Error UnifiedRunner::generate(
    const std::string &prompt, const llm::GenerationConfig &generation_config,
    std::function<void(const std::string &)> token_callback,
    std::function<void(const llm::Stats &)> stats_callback) {

  ET_CHECK_MSG(!prompt.empty(), "Prompt cannot be null");

  // In multimodal mode, delegate to the multimodal generate path with
  // text-only input (no image).
  if (multimodal_) {
    std::vector<llm::MultimodalInput> text_inputs = {
        llm::make_text_input(prompt)};
    float temp =
        generation_config.temperature >= 0.F
            ? generation_config.temperature
            : (config_.temperature >= 0.F ? config_.temperature : 0.8F);
    float topp = generation_config.topp >= 0.F
                     ? generation_config.topp
                     : (config_.topp >= 0.F ? config_.topp : 0.9F);
    return generate(text_inputs, temp, topp, -1, token_callback);
  }

  if (!is_loaded()) {
    stats_.model_load_start_ms = llm::time_in_ms();
    ET_CHECK_OK_OR_RETURN_ERROR(load());
    stats_.model_load_end_ms = llm::time_in_ms();
  }

  std::function<void(const std::string &)> wrapped_callback =
      [token_callback, &generation_config](const std::string &piece) {
        if (!generation_config.warming) {
          llm::safe_printf(piece.c_str());
          fflush(stdout);
        }
        if (token_callback)
          token_callback(piece);
      };

  stats_.inference_start_ms = llm::time_in_ms();
  shouldStop_ = false;

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

  auto encodeResult =
      tokenizer_->encode(prompt, numOfAddedBoSTokens, numOfAddedEoSTokens);
  if (!encodeResult.ok()) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while encoding: " +
            std::to_string(static_cast<int32_t>(encodeResult.error())));
  }
  std::vector<uint64_t> prompt_tokens = encodeResult.get();
  int num_prompt_tokens = prompt_tokens.size();

  ET_CHECK_OR_RETURN_ERROR(num_prompt_tokens >= 1, InvalidArgument,
                           "Expected at least 1 prompt token");
  ET_CHECK_OR_RETURN_ERROR(num_prompt_tokens < max_seq_len, InvalidArgument,
                           "num_prompt_tokens %d >= max_seq_len %" PRId32,
                           num_prompt_tokens, max_seq_len);

  int32_t max_new_tokens = resolve_max_new_tokens(
      num_prompt_tokens, max_seq_len, static_cast<int32_t>(context_len_left),
      new_tokens_limit);

  ET_CHECK_OR_RETURN_ERROR(max_new_tokens > 0, InvalidArgument,
                           "Max new tokens %d is <= 0", max_new_tokens);

  if (generation_config.echo)
    wrapped_callback(prompt);

  auto prefill_res = text_prefiller_->prefill(prompt_tokens, pos_);
  stats_.first_token_ms = llm::time_in_ms();
  stats_.prompt_eval_end_ms = llm::time_in_ms();
  ET_CHECK_OK_OR_RETURN_ERROR(prefill_res.error());

  uint64_t cur_token = prefill_res.get();
  auto decodeResult = tokenizer_->decode({cur_token});
  if (!decodeResult.ok()) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while decoding: " +
            std::to_string(static_cast<int32_t>(decodeResult.error())));
  }

  prompt_tokens.push_back(cur_token);
  int64_t num_generated = ET_UNWRAP(
      text_token_generator_->generate(prompt_tokens, pos_, max_new_tokens - 1,
                                      temperature, topp, wrapped_callback));

  pos_ += num_generated;
  stats_.inference_end_ms = llm::time_in_ms();
  stats_.num_prompt_tokens = num_prompt_tokens;
  stats_.num_generated_tokens = num_generated;

  if (stats_callback)
    stats_callback(stats_);

  return Error::Ok;
}

Error UnifiedRunner::generate(
    const std::vector<llm::MultimodalInput> &inputs, float temperature,
    float topp, int32_t max_new_tokens,
    std::function<void(const std::string &)> token_callback) {

  ET_CHECK_MSG(multimodal_,
               "generate(MultimodalInput) called on a text-only runner. Use "
               "generate(string) instead.");

  if (inputs.empty()) {
    ET_LOG(Error, "MultimodalInput vector cannot be empty");
    return Error::InvalidArgument;
  }

  if (!is_loaded())
    ET_CHECK_OK_OR_RETURN_ERROR(load());

  stats_.inference_start_ms = llm::time_in_ms();

  uint64_t prefill_next_token = 0;
  for (size_t i = 0; i < inputs.size(); ++i) {
    auto prefill_result = mm_prefiller_->prefill(inputs[i], pos_);
    if (!prefill_result.ok())
      return prefill_result.error();
    prefill_next_token = prefill_result.get();
  }

  stats_.first_token_ms = llm::time_in_ms();
  stats_.prompt_eval_end_ms = llm::time_in_ms();
  stats_.num_prompt_tokens = pos_;

  int32_t resolved_max_new =
      max_new_tokens > 0
          ? max_new_tokens
          : static_cast<int32_t>(config_.max_context_length - pos_);
  resolved_max_new = std::max(0, resolved_max_new);

  std::vector<uint64_t> seed_tokens = {prefill_next_token};
  auto wrapped_callback = [&](const std::string &piece) {
    llm::safe_printf(piece.c_str());
    fflush(stdout);
    if (token_callback)
      token_callback(piece);
  };

  auto generate_result = mm_token_generator_->generate(
      seed_tokens, pos_,
      static_cast<uint64_t>(std::max(0, resolved_max_new - 1)), temperature,
      topp, wrapped_callback);

  if (!generate_result.ok())
    return generate_result.error();

  int64_t num_generated = generate_result.get();
  pos_ += num_generated;

  stats_.inference_end_ms = llm::time_in_ms();
  stats_.num_generated_tokens = num_generated;

  return Error::Ok;
}

void UnifiedRunner::stop() {
  if (multimodal_) {
    if (mm_token_generator_)
      mm_token_generator_->stop();
  } else {
    if (text_token_generator_)
      text_token_generator_->stop();
  }
}

void UnifiedRunner::reset() {
  stats_.reset();
  pos_ = 0;
}

int32_t UnifiedRunner::count_text_tokens(const std::string &text) const {
  auto encodeResult =
      tokenizer_->encode(text, numOfAddedBoSTokens, numOfAddedEoSTokens);
  if (!encodeResult.ok()) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Encoding failed during token count check.");
  }
  return static_cast<int32_t>(encodeResult.get().size());
}

int32_t UnifiedRunner::get_max_context_length() const {
  if (!is_loaded()) {
    return static_cast<int32_t>(metadata_.at(kMaxContextLen));
  }
  return config_.max_context_length;
}

void UnifiedRunner::set_temperature(float temperature) noexcept {
  config_.temperature = temperature;
  if (text_decoder_runner_)
    text_decoder_runner_->set_temperature(temperature);
}

void UnifiedRunner::set_topp(float topp) noexcept {
  config_.topp = topp;
  if (text_decoder_runner_)
    text_decoder_runner_->set_topp(topp);
}

void UnifiedRunner::set_count_interval(size_t count_interval) {
  if (text_token_generator_)
    text_token_generator_->set_count_interval(count_interval);
  if (mm_token_generator_)
    mm_token_generator_->set_count_interval(count_interval);
}

void UnifiedRunner::set_time_interval(size_t time_interval) {
  if (text_token_generator_)
    text_token_generator_->set_time_interval(time_interval);
  if (mm_token_generator_)
    mm_token_generator_->set_time_interval(time_interval);
}

int32_t UnifiedRunner::resolve_max_new_tokens(int32_t num_prompt_tokens,
                                              int32_t max_seq_len,
                                              int32_t max_context_len,
                                              int32_t max_new_tokens) const {
  int32_t result;
  if (max_seq_len == -1 && max_new_tokens == -1) {
    result = max_context_len - num_prompt_tokens;
  } else if (max_seq_len == -1) {
    result = std::min(max_new_tokens, max_context_len - num_prompt_tokens);
  } else if (max_new_tokens == -1) {
    result = std::min(max_seq_len, max_context_len) - num_prompt_tokens;
  } else {
    result =
        std::min(std::min(max_seq_len, max_context_len) - num_prompt_tokens,
                 max_new_tokens);
  }
  return std::max(0, result);
}

} // namespace example
