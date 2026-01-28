#pragma once

#include <memory>
#include <string>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <rnexecutorch/models/BaseModel.h>
#include <runner/runner.h>

namespace rnexecutorch {
namespace models::llm {
using namespace facebook;

class LLM : public BaseModel {
public:
  explicit LLM(const std::string &modelSource,
               const std::string &tokenizerSource,
               std::shared_ptr<react::CallInvoker> callInvoker);

#ifdef TEST_BUILD
  std::string generate(std::string input,
                       std::shared_ptr<jsi::Function> callback);
#else
  void generate(std::string input, std::shared_ptr<jsi::Function> callback);
#endif
  void interrupt();
  void unload() noexcept;
  size_t getGeneratedTokenCount() const noexcept;
  size_t getMemoryLowerBound() const noexcept;
  void setCountInterval(size_t countInterval);
  void setTemperature(float temperature);
  void setTopp(float topp);
  void setTimeInterval(size_t timeInterval);

private:
  std::unique_ptr<example::Runner> runner;
};
} // namespace models::llm

REGISTER_CONSTRUCTOR(models::llm::LLM, std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
