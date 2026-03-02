#pragma once

#include <memory>
#include <string>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/BaseModel.h>
#include <runner/image.h>
#include <runner/unified_runner.h>

namespace rnexecutorch {
namespace models::llm {
using namespace facebook;

class LLM : public BaseModel {
public:
  explicit LLM(const std::string &modelSource,
               const std::string &tokenizerSource,
               std::shared_ptr<react::CallInvoker> callInvoker);

  // Text-only generate (existing signature — used by LLMController)
  std::string generate(std::string input,
                       std::shared_ptr<jsi::Function> callback);

  // Multimodal generate (image + text prompt)
  std::string generate(std::string imagePath, std::string prompt,
                       std::shared_ptr<jsi::Function> callback);

  // Multimodal generate — takes full message history, builds MultimodalInput[]
  std::string generateMultimodal(
      std::vector<rnexecutorch::jsi_conversion::NativeMessage> messages,
      std::shared_ptr<jsi::Function> callback);

  bool isMultimodal() const noexcept;

  void interrupt();
  void reset();
  void unload() noexcept;
  size_t getGeneratedTokenCount() const noexcept;
  size_t getPromptTokenCount() const noexcept;
  int32_t countTextTokens(std::string text) const;
  size_t getMemoryLowerBound() const noexcept;
  void setCountInterval(size_t countInterval);
  void setTemperature(float temperature);
  void setTopp(float topp);
  void setTimeInterval(size_t timeInterval);
  int32_t getMaxContextLength() const;

private:
  std::unique_ptr<example::UnifiedRunner> runner_;
  bool multimodal_;
  float temperature_ = 0.8f;
  float topp_ = 0.9f;
  std::unordered_map<std::string, executorch::extension::llm::Image>
      imageCache_;
  const executorch::extension::llm::Image &
  getOrLoadImage(const std::string &path);
};
} // namespace models::llm

REGISTER_CONSTRUCTOR(models::llm::LLM, std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
