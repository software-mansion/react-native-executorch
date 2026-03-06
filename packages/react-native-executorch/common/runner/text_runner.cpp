// common/runner/text_runner.cpp
#include "text_runner.h"
#include "constants.h"
#include "util.h"
#include <cstdint>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>

namespace executorch::extension::llm {

using ::executorch::extension::Module;
using ::executorch::runtime::Error;

TextRunner::TextRunner(std::unique_ptr<Module> module,
                       const std::string &tokenizer_path,
                       const GenerationConfig &config)
    : BaseLLMRunner(std::move(module), tokenizer_path, config) {}

bool TextRunner::is_loaded() const {
  return module_ && module_->is_loaded() && tokenizer_ &&
         tokenizer_->is_loaded() && text_decoder_runner_ && text_prefiller_ &&
         text_token_generator_;
}

Error TextRunner::load_subcomponents() {
  ET_CHECK_OK_OR_RETURN_ERROR(module_->load_method("forward"));

  Stats *stats_ptr = &stats_;

  text_decoder_runner_ = std::make_unique<TextDecoderRunner>(
      module_.get(), io_manager_.get(), config_.temperature, config_.topp);
  text_prefiller_ = std::make_unique<TextPrefiller>(
      text_decoder_runner_.get(), config_.enable_kv_cache,
      config_.enable_dynamic_shape, config_.max_seq_len);
  text_token_generator_ = std::make_unique<TextTokenGenerator>(
      tokenizer_.get(), text_decoder_runner_.get(), config_.enable_kv_cache,
      std::move(eos_ids_), stats_ptr);

  return Error::Ok;
}

Error TextRunner::generate_internal(
    const std::vector<MultimodalInput> &inputs,
    std::function<void(const std::string &)> token_callback) {

  if (inputs.empty()) {
    return Error::InvalidArgument;
  }

  const std::string &prompt = inputs[0].get_text();
  ET_CHECK_MSG(!prompt.empty(), "Prompt cannot be null");

  if (!is_loaded()) {
    stats_.model_load_start_ms = time_in_ms();
    ET_CHECK_OK_OR_RETURN_ERROR(load());
    stats_.model_load_end_ms = time_in_ms();
  }

  std::function<void(const std::string &)> wrapped_callback =
      [token_callback](const std::string &piece) {
        safe_printf(piece.c_str());
        fflush(stdout);
        if (token_callback)
          token_callback(piece);
      };

  stats_.inference_start_ms = time_in_ms();

  int64_t context_len_left =
      static_cast<int64_t>(config_.max_context_length) - pos_;

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
  ET_CHECK_OR_RETURN_ERROR(num_prompt_tokens < config_.max_seq_len,
                           InvalidArgument,
                           "num_prompt_tokens %d >= max_seq_len %" PRId32,
                           num_prompt_tokens, config_.max_seq_len);

  int32_t max_new_tokens = resolve_max_new_tokens(
      num_prompt_tokens, config_.max_seq_len,
      static_cast<int32_t>(context_len_left), config_.max_new_tokens);

  ET_CHECK_OR_RETURN_ERROR(max_new_tokens > 0, InvalidArgument,
                           "Max new tokens %d is <= 0", max_new_tokens);

  if (config_.echo)
    wrapped_callback(prompt);

  auto prefill_res = text_prefiller_->prefill(prompt_tokens, pos_);
  stats_.first_token_ms = time_in_ms();
  stats_.prompt_eval_end_ms = time_in_ms();
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
  int64_t num_generated = ET_UNWRAP(text_token_generator_->generate(
      prompt_tokens, pos_, max_new_tokens - 1, config_.temperature,
      config_.topp, wrapped_callback));

  pos_ += num_generated;
  stats_.inference_end_ms = time_in_ms();
  stats_.num_prompt_tokens = num_prompt_tokens;
  stats_.num_generated_tokens = num_generated;

  return Error::Ok;
}

void TextRunner::stop_impl() {
  if (text_token_generator_)
    text_token_generator_->stop();
}

void TextRunner::set_temperature_impl(float temperature) {
  if (text_decoder_runner_)
    text_decoder_runner_->set_temperature(temperature);
}

void TextRunner::set_topp_impl(float topp) {
  if (text_decoder_runner_)
    text_decoder_runner_->set_topp(topp);
}

void TextRunner::set_count_interval_impl(size_t count_interval) {
  if (text_token_generator_)
    text_token_generator_->set_count_interval(count_interval);
}

void TextRunner::set_time_interval_impl(size_t time_interval) {
  if (text_token_generator_)
    text_token_generator_->set_time_interval(time_interval);
}

} // namespace executorch::extension::llm
