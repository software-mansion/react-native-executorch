// common/runner/base_llm_runner.h
#pragma once

#include "io_manager.h"
#include "irunner.h"
#include "multimodal_input.h"
#include "stats.h"
#include <cstdint>
#include <executorch/extension/module/module.h>
#include <functional>
#include <memory>
#include <pytorch/tokenizers/hf_tokenizer.h>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace example {

namespace llm = ::executorch::extension::llm;

class BaseLLMRunner {
public:
  explicit BaseLLMRunner(
      ::executorch::extension::Module *module,
      std::unique_ptr<::executorch::extension::Module> owned_module,
      const std::string &tokenizer_path,
      const llm::GenerationConfig &config = {.temperature = 0.8F,
                                             .topp = 0.9F});

  virtual ~BaseLLMRunner() = default;

  virtual bool is_loaded() const = 0;

  // Loads tokenizer + metadata + eos, then calls load_subcomponents()
  virtual ::executorch::runtime::Error load();

  // Text convenience — wraps string in make_text_input, calls generate_internal
  ::executorch::runtime::Error
  generate(const std::string &prompt,
           const llm::GenerationConfig &generation_config = {},
           std::function<void(const std::string &)> token_callback = {},
           std::function<void(const llm::Stats &)> stats_callback = {});

  // Multimodal entry point — subclasses implement this
  virtual ::executorch::runtime::Error generate_internal(
      const std::vector<llm::MultimodalInput> &inputs,
      std::function<void(const std::string &)> token_callback) = 0;

  void stop();
  void reset();
  int32_t count_text_tokens(const std::string &text) const;
  int32_t get_max_context_length() const;

  // Writes config_ then propagates to subclass impl
  void set_temperature(float temperature) noexcept;
  void set_topp(float topp) noexcept;
  void set_count_interval(size_t count_interval);
  void set_time_interval(size_t time_interval);

  llm::Stats stats_;

  // Public for test access
  llm::GenerationConfig config_;
  int64_t pos_{0};

protected:
  virtual ::executorch::runtime::Error load_subcomponents() = 0;
  virtual void stop_impl() = 0;
  virtual void set_temperature_impl(float temperature) = 0;
  virtual void set_topp_impl(float topp) = 0;
  virtual void set_count_interval_impl(size_t count_interval) = 0;
  virtual void set_time_interval_impl(size_t time_interval) = 0;

  int32_t resolve_max_new_tokens(int32_t num_prompt_tokens, int32_t max_seq_len,
                                 int32_t max_context_len,
                                 int32_t max_new_tokens = -1) const;

  ::executorch::extension::Module *module_;
  std::unique_ptr<::executorch::extension::Module> owned_module_;
  std::string tokenizer_path_;
  std::unique_ptr<tokenizers::HFTokenizer> tokenizer_;
  std::unordered_map<std::string, int64_t> metadata_;
  std::unique_ptr<llm::IOManager> io_manager_;
  bool shouldStop_{false};
};

} // namespace example
