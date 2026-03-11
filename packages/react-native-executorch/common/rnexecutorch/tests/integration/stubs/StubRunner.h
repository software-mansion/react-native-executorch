#pragma once

#include <runner/base_llm_runner.h>

// Minimal concrete subclass of BaseLLMRunner — only used in tests to verify
// base class behavior without a full runner implementation.
class StubRunner : public ::executorch::extension::llm::BaseLLMRunner {
public:
  using BaseLLMRunner::BaseLLMRunner;
  bool is_loaded() const override { return loaded_; }
  ::executorch::runtime::Error load_subcomponents() override {
    loaded_ = true;
    return ::executorch::runtime::Error::Ok;
  }
  ::executorch::runtime::Error generate_internal(
      const std::vector<::executorch::extension::llm::MultimodalInput> &,
      std::function<void(const std::string &)>) override {
    return ::executorch::runtime::Error::Ok;
  }
  void stop_impl() override {}
  void set_temperature_impl(float t) override { last_temp_ = t; }
  void set_topp_impl(float) override {}
  void set_count_interval_impl(size_t) override {}
  void set_time_interval_impl(size_t) override {}

  int32_t resolve_max(int32_t prompt, int32_t seq_len, int32_t ctx_len,
                      int32_t max_new = -1) const {
    return resolve_max_new_tokens(prompt, seq_len, ctx_len, max_new);
  }

  bool loaded_ = false;
  float last_temp_ = -1.f;
};
