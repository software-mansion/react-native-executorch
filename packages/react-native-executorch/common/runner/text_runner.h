// common/runner/text_runner.h
#pragma once

#include "base_llm_runner.h"
#include "text_decoder_runner.h"
#include "text_prefiller.h"
#include "text_token_generator.h"

namespace rnexecutorch::llm::runner {

class TextRunner : public BaseLLMRunner {
public:
  explicit TextRunner(
      std::unique_ptr<::executorch::extension::Module> owned_module,
      const std::string &tokenizer_path,
      const ::executorch::extension::llm::GenerationConfig &config = {
          .temperature = 0.8F, .topp = 0.9F});

  bool is_loaded() const override;

  ::executorch::runtime::Error generate_internal(
      const std::vector<::executorch::extension::llm::MultimodalInput> &inputs,
      std::function<void(const std::string &)> token_callback) override;

protected:
  ::executorch::runtime::Error load_subcomponents() override;
  void stop_impl() override;
  void set_temperature_impl(float temperature) override;
  void set_topp_impl(float topp) override;
  void set_count_interval_impl(size_t count_interval) override;
  void set_time_interval_impl(size_t time_interval) override;

private:
  std::unique_ptr<::executorch::extension::llm::TextDecoderRunner>
      text_decoder_runner_;
  std::unique_ptr<::executorch::extension::llm::TextPrefiller> text_prefiller_;
  std::unique_ptr<::executorch::extension::llm::TextTokenGenerator>
      text_token_generator_;
};

} // namespace rnexecutorch::llm::runner
