// common/runner/multimodal_runner.cpp
#include "multimodal_runner.h"
#include "constants.h"
#include "util.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>

namespace example {

using namespace executorch::extension::llm;
using ::executorch::extension::Module;
using ::executorch::runtime::Error;

MultimodalRunner::MultimodalRunner(
    std::unique_ptr<Module> owned_module, const std::string &tokenizer_path,
    std::map<MultimodalType, std::unique_ptr<IEncoder>> encoders,
    const llm::GenerationConfig &config)
    : BaseLLMRunner(nullptr, std::move(owned_module), tokenizer_path, config),
      encoders_(std::move(encoders)) {}

bool MultimodalRunner::is_loaded() const {
  if (!mm_prefiller_ || !mm_token_generator_)
    return false;
  if (!mm_prefiller_->is_method_loaded() || !mm_token_generator_->is_loaded())
    return false;
  for (const auto &[type, encoder] : encoders_) {
    if (!encoder->is_loaded())
      return false;
  }
  return true;
}

Error MultimodalRunner::load_subcomponents() {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info, "[MultimodalRunner] Loading",
                    encoders_.size(), "encoder(s)");
  // Load and validate all declared encoders — throws on mismatch
  for (auto &[type, encoder] : encoders_) {
    rnexecutorch::log(
        rnexecutorch::LOG_LEVEL::Debug,
        "[MultimodalRunner] Loading encoder type:", static_cast<int>(type));
    encoder->load();
    rnexecutorch::log(
        rnexecutorch::LOG_LEVEL::Info,
        "[MultimodalRunner] Encoder loaded, type:", static_cast<int>(type));
  }

  llm::Stats *stats_ptr = &stats_;
  auto eos_ids = std::make_unique<std::unordered_set<uint64_t>>();
  const auto method_names =
      ET_UNWRAP(module_->method_names(), "Failed reading method names");
  if (method_names.count(kEosIds)) {
    for (const auto &eos_id : ET_UNWRAP(module_->execute(kEosIds))) {
      eos_ids->emplace(static_cast<uint64_t>(eos_id.toScalar().to<int64_t>()));
    }
  }
  if (eos_ids->empty()) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Warn,
                      "[MultimodalRunner] get_eos_ids not found in model, "
                      "falling back to {7}");
    eos_ids->emplace(7);
  } else {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[MultimodalRunner] EOS IDs loaded:", *eos_ids);
  }

  mm_decoder_runner_ = std::make_unique<llm::MultimodalDecoderRunner>(
      module_, io_manager_.get());
  mm_prefiller_ = std::make_unique<llm::MultimodalPrefiller>(
      module_, mm_decoder_runner_.get(), tokenizer_.get(), io_manager_.get());
  mm_token_generator_ = std::make_unique<llm::TextTokenGenerator>(
      tokenizer_.get(), mm_decoder_runner_.get(), /*use_kv_cache=*/true,
      std::move(eos_ids), stats_ptr);

  ET_CHECK_OK_OR_RETURN_ERROR(mm_prefiller_->load());
  ET_CHECK_OK_OR_RETURN_ERROR(mm_token_generator_->load());
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[MultimodalRunner] All subcomponents loaded successfully");
  return Error::Ok;
}

Error MultimodalRunner::generate_internal(
    const std::vector<llm::MultimodalInput> &inputs,
    std::function<void(const std::string &)> token_callback) {

  if (inputs.empty())
    return Error::InvalidArgument;
  if (!is_loaded())
    ET_CHECK_OK_OR_RETURN_ERROR(load());

  stats_.inference_start_ms = llm::time_in_ms();

  uint64_t prefill_next_token = 0;
  for (const auto &input : inputs) {
    auto prefill_result = mm_prefiller_->prefill(input, pos_);
    if (!prefill_result.ok())
      return prefill_result.error();
    prefill_next_token = prefill_result.get();
  }

  stats_.first_token_ms = llm::time_in_ms();
  stats_.prompt_eval_end_ms = llm::time_in_ms();
  stats_.num_prompt_tokens = pos_;
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[MultimodalRunner] Prefill took",
                    stats_.prompt_eval_end_ms - stats_.inference_start_ms,
                    "ms for", pos_, "tokens");

  int32_t resolved_max_new =
      static_cast<int32_t>(config_.max_context_length - pos_);
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
      static_cast<uint64_t>(std::max(0, resolved_max_new - 1)),
      config_.temperature, config_.topp, wrapped_callback);

  if (!generate_result.ok())
    return generate_result.error();

  int64_t num_generated = generate_result.get();
  pos_ += num_generated;
  stats_.inference_end_ms = llm::time_in_ms();
  stats_.num_generated_tokens = num_generated;

  return Error::Ok;
}

void MultimodalRunner::stop_impl() {
  if (mm_token_generator_)
    mm_token_generator_->stop();
}

void MultimodalRunner::set_count_interval_impl(size_t count_interval) {
  if (mm_token_generator_)
    mm_token_generator_->set_count_interval(count_interval);
}

void MultimodalRunner::set_time_interval_impl(size_t time_interval) {
  if (mm_token_generator_)
    mm_token_generator_->set_time_interval(time_interval);
}

} // namespace example
