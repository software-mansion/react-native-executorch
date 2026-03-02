// packages/react-native-executorch/common/runner/unified_runner.h
#pragma once

#include "multimodal_decoder_runner.h"
#include "multimodal_input.h"
#include "multimodal_prefiller.h"
#include "stats.h"
#include "text_decoder_runner.h"
#include "text_prefiller.h"
#include "text_token_generator.h"
#include <cstdint>
#include <executorch/extension/module/module.h>
#include <functional>
#include <memory>
#include <optional>
#include <pytorch/tokenizers/hf_tokenizer.h>
#include <string>
#include <unordered_map>
#include <vector>

namespace example {

namespace llm = ::executorch::extension::llm;

class UnifiedRunner {
public:
  // module: raw pointer borrowed from BaseModel (text mode uses this)
  // owned_module: unique_ptr taken for multimodal mode (nullptr in text mode)
  // tokenizer_path: path to tokenizer JSON
  // config: generation defaults
  explicit UnifiedRunner(
      ::executorch::extension::Module *module,
      std::unique_ptr<::executorch::extension::Module> owned_module,
      const std::string &tokenizer_path,
      const llm::GenerationConfig &config = {.temperature = 0.8F,
                                             .topp = 0.9F});

  bool is_multimodal() const noexcept;
  bool is_loaded() const;
  ::executorch::runtime::Error load();

  // Text-only generate — mirrors Runner::generate signature
  ::executorch::runtime::Error
  generate(const std::string &prompt,
           const llm::GenerationConfig &generation_config = {},
           std::function<void(const std::string &)> token_callback = {},
           std::function<void(const llm::Stats &)> stats_callback = {});

  // Multimodal generate — mirrors MultimodalRunner::generate signature
  ::executorch::runtime::Error
  generate(const std::vector<llm::MultimodalInput> &inputs, float temperature,
           float topp, int32_t max_new_tokens,
           std::function<void(const std::string &)> token_callback = {});

  void stop();
  void reset();

  // Available for both modes
  int32_t count_text_tokens(const std::string &text) const;
  int32_t get_max_context_length() const;
  void set_temperature(float temperature) noexcept;
  void set_topp(float topp) noexcept;
  void set_count_interval(size_t count_interval);
  void set_time_interval(size_t time_interval);

  llm::Stats stats_;

private:
  int32_t resolve_max_new_tokens(int32_t num_prompt_tokens, int32_t max_seq_len,
                                 int32_t max_context_len,
                                 int32_t max_new_tokens = -1) const;

  bool multimodal_{false};
  llm::GenerationConfig config_;
  bool shouldStop_{false};
  int64_t pos_{0};

  // module access — module_ is always a valid raw pointer
  // In text mode: points to BaseModel's module_ (borrowed)
  // In multimodal mode: points to owned_module_.get() (owned)
  ::executorch::extension::Module *module_;
  std::unique_ptr<::executorch::extension::Module> owned_module_;

  std::string tokenizer_path_;
  std::unique_ptr<tokenizers::HFTokenizer> tokenizer_;
  std::unordered_map<std::string, int64_t> metadata_;
  std::unique_ptr<llm::IOManager> io_manager_;

  // Text-only subcomponents (null in multimodal mode)
  std::unique_ptr<llm::TextDecoderRunner> text_decoder_runner_;
  std::unique_ptr<llm::TextPrefiller> text_prefiller_;
  std::unique_ptr<llm::TextTokenGenerator> text_token_generator_;

  // Multimodal subcomponents (null in text mode)
  std::unique_ptr<llm::MultimodalDecoderRunner> mm_decoder_runner_;
  std::unique_ptr<llm::MultimodalPrefiller> mm_prefiller_;
  std::unique_ptr<llm::TextTokenGenerator> mm_token_generator_;
};

} // namespace example
