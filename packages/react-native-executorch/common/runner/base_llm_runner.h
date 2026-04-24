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

namespace executorch::extension::llm {
class BaseLLMRunner {
public:
  explicit BaseLLMRunner(
      std::unique_ptr<::executorch::extension::Module> module,
      const std::string &tokenizer_path,
      const GenerationConfig &config = {.temperature = 0.8F, .topp = 0.9F});

  virtual ~BaseLLMRunner() = default;

  virtual bool is_loaded() const = 0;

  virtual ::executorch::runtime::Error load();

  ::executorch::runtime::Error
  generate(const std::string &prompt,
           const GenerationConfig &generation_config = {},
           std::function<void(const std::string &)> token_callback = {},
           std::function<void(const Stats &)> stats_callback = {});

  ::executorch::runtime::Error
  generate(const std::vector<MultimodalInput> &inputs,
           std::function<void(const std::string &)> token_callback = {},
           std::function<void(const Stats &)> stats_callback = {});

  virtual ::executorch::runtime::Error generate_internal(
      const std::vector<MultimodalInput> &inputs,
      std::function<void(const std::string &)> token_callback) = 0;

  void stop();
  void reset();
  int32_t count_text_tokens(const std::string &text) const;
  int32_t get_max_context_length() const;
  virtual bool is_multimodal() const { return false; }
  virtual int32_t get_visual_token_count() const { return 0; }

  void set_temperature(float temperature) noexcept;
  void set_topp(float topp) noexcept;
  void set_min_p(float min_p) noexcept;
  void set_repetition_penalty(float repetition_penalty) noexcept;
  void set_count_interval(size_t count_interval);
  void set_time_interval(size_t time_interval);

  Stats stats_;

  // Public for test access
  GenerationConfig config_;
  int64_t pos_{0};

protected:
  virtual ::executorch::runtime::Error load_subcomponents() = 0;
  virtual void stop_impl() = 0;
  // Sampling values and token-batching intervals live entirely in `config_`.
  // The TextDecoderRunner / TextTokenGenerator shared by both TextRunner and
  // MultimodalRunner are constructed with a const reference to `config_`
  // and read those fields on every iteration, so writes via the public
  // set_* methods on BaseLLMRunner take effect immediately with no virtual
  // dispatch needed.

  int32_t resolve_max_new_tokens(int32_t num_prompt_tokens, int32_t max_seq_len,
                                 int32_t max_context_len,
                                 int32_t max_new_tokens = -1) const;

  std::unique_ptr<::executorch::extension::Module> module_;
  std::string tokenizer_path_;
  std::unique_ptr<tokenizers::HFTokenizer> tokenizer_;
  std::unordered_map<std::string, int64_t> metadata_;
  std::unique_ptr<IOManager> io_manager_;
  std::unique_ptr<std::unordered_set<uint64_t>> eos_ids_;
};

} // namespace executorch::extension::llm
