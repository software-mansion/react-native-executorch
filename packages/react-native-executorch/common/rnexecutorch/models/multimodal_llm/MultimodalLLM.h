#pragma once

#include <memory>
#include <string>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <rnexecutorch/models/BaseModel.h>
#include <runner/multimodal_runner.h>

namespace rnexecutorch {
namespace models::multimodal_llm {
using namespace facebook;

class MultimodalLLM : public BaseModel {
public:
  explicit MultimodalLLM(const std::string &modelSource,
                         const std::string &tokenizerSource,
                         std::shared_ptr<react::CallInvoker> callInvoker);

  std::string generate(std::string imagePath, std::string prompt,
                       std::shared_ptr<jsi::Function> callback);
  void interrupt();
  void unload() noexcept;
  size_t getGeneratedTokenCount() const noexcept;
  size_t getPromptTokenCount() const noexcept;
  size_t getMemoryLowerBound() const noexcept;
  void setTemperature(float temperature);
  void setTopp(float topp);

private:
  float temperature_ = 0.8f;
  float topp_ = 0.9f;
  std::unique_ptr<::executorch::extension::llm::MultimodalRunner> runner_;
};
} // namespace models::multimodal_llm

REGISTER_CONSTRUCTOR(models::multimodal_llm::MultimodalLLM, std::string,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
