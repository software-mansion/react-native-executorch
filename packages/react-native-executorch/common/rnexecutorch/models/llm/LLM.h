#pragma once

#include <memory>
#include <mutex>
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

  std::string generate(std::string prompt,
                       std::shared_ptr<jsi::Function> callback);
  std::string generateMultimodal(std::string prompt,
                                 std::vector<std::string> imagePaths,
                                 std::string imageToken,
                                 std::shared_ptr<jsi::Function> callback);
  std::string generateFromFrame(jsi::Runtime &runtime,
                                const jsi::Value &frameData, std::string prompt,
                                std::string imageToken);
  void setFrameCallback(std::shared_ptr<jsi::Function> callback);

  void interrupt();
  void reset();
  void unload() noexcept;
  int32_t getGeneratedTokenCount() const noexcept;
  int32_t getPromptTokenCount() const noexcept;
  int32_t countTextTokens(std::string text) const;
  int32_t getVisualTokenCount() const;
  size_t getMemoryLowerBound() const noexcept;
  void setCountInterval(size_t countInterval);
  void setTemperature(float temperature);
  void setTopp(float topp);
  void setTimeInterval(size_t timeInterval);
  int32_t getMaxContextLength() const;

private:
  mutable std::mutex inference_mutex_;
  std::unique_ptr<::executorch::extension::llm::BaseLLMRunner> runner_;
  std::shared_ptr<jsi::Function> frameCallback_;
};
} // namespace models::llm

REGISTER_CONSTRUCTOR(models::llm::LLM, std::string, std::string,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
