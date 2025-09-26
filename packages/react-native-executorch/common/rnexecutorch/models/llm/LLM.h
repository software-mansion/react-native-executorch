#pragma once

#include <memory>
#include <string>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <runner/runner.h>

namespace rnexecutorch {
namespace models::llm {
using namespace facebook;

class LLM {
public:
  explicit LLM(const std::string &modelSource,
               const std::string &tokenizerSource,
               std::shared_ptr<react::CallInvoker> callInvoker);

  void generate(std::string input, std::shared_ptr<jsi::Function> callback);
  void interrupt();
  void unload() noexcept;
  size_t getGeneratedTokenCount() const noexcept;
  size_t getMemoryLowerBound() const noexcept;
  void setCountInterval(size_t countInterval);
  void setTimeInterval(size_t timeInterval);

private:
  size_t memorySizeLowerBound;
  std::unique_ptr<example::Runner> runner;
  std::shared_ptr<react::CallInvoker> callInvoker;
};
} // namespace models::llm

REGISTER_CONSTRUCTOR(models::llm::LLM, std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
