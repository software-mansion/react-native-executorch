#pragma once

#include <memory>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <rnexecutorch/models/BaseModel.h>
#include <runner/base_llm_runner.h>

namespace rnexecutorch {
namespace models::llm {
using namespace facebook;

class LLM : public BaseModel {
public:
  explicit LLM(const std::string &modelSource,
               const std::string &tokenizerSource,
               std::vector<std::string> capabilities,
               std::shared_ptr<react::CallInvoker> callInvoker);

  // Text-only: pre-rendered prompt string
  std::string generate(std::string prompt,
                       std::shared_ptr<jsi::Function> callback);

  // Multimodal: pre-rendered prompt string with <image> placeholders +
  // ordered list of image paths (one per placeholder)
  std::string generate(std::string prompt, std::vector<std::string> imagePaths,
                       std::shared_ptr<jsi::Function> callback);

  void interrupt();
  void reset();
  void unload() noexcept;
  size_t getGeneratedTokenCount() const noexcept;
  size_t getPromptTokenCount() const noexcept;
  int32_t countTextTokens(std::string text) const;
  int32_t getVisualTokenCount() const;
  size_t getMemoryLowerBound() const noexcept;
  void setCountInterval(size_t countInterval);
  void setTemperature(float temperature);
  void setTopp(float topp);
  void setTimeInterval(size_t timeInterval);
  int32_t getMaxContextLength() const;

private:
  std::unique_ptr<example::BaseLLMRunner> runner_;
};
} // namespace models::llm

REGISTER_CONSTRUCTOR(models::llm::LLM, std::string, std::string,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
