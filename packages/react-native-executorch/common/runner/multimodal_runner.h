// common/runner/multimodal_runner.h
#pragma once

#include "base_llm_runner.h"
#include "encoders/iencoder.h"
#include "multimodal_decoder_runner.h"
#include "multimodal_input.h"
#include "multimodal_prefiller.h"
#include "text_token_generator.h"
#include <map>

namespace executorch::extension::llm {
// Tag enum for keying encoder map
enum class MultimodalType { Image, Audio };
} // namespace executorch::extension::llm

namespace example {

class MultimodalRunner : public BaseLLMRunner {
public:
  explicit MultimodalRunner(
      std::unique_ptr<::executorch::extension::Module> owned_module,
      const std::string &tokenizer_path,
      std::map<::executorch::extension::llm::MultimodalType,
               std::unique_ptr<::executorch::extension::llm::IEncoder>>
          encoders,
      const ::executorch::extension::llm::GenerationConfig &config = {
          .temperature = 0.8F, .topp = 0.9F});

  bool is_loaded() const override;
  int32_t get_visual_token_count() const override;

  ::executorch::runtime::Error generate_internal(
      const std::vector<::executorch::extension::llm::MultimodalInput> &inputs,
      std::function<void(const std::string &)> token_callback) override;

protected:
  ::executorch::runtime::Error load_subcomponents() override;
  void stop_impl() override;
  void set_temperature_impl(float) override {
  } // config_ already updated by base
  void set_topp_impl(float) override {} // config_ already updated by base
  void set_count_interval_impl(size_t count_interval) override;
  void set_time_interval_impl(size_t time_interval) override;

private:
  std::map<::executorch::extension::llm::MultimodalType,
           std::unique_ptr<::executorch::extension::llm::IEncoder>>
      encoders_;
  std::unique_ptr<::executorch::extension::llm::MultimodalDecoderRunner>
      mm_decoder_runner_;
  std::unique_ptr<::executorch::extension::llm::MultimodalPrefiller>
      mm_prefiller_;
  std::unique_ptr<::executorch::extension::llm::TextTokenGenerator>
      mm_token_generator_;
};

} // namespace example
