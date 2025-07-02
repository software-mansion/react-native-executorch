#pragma once

#include <memory>
#include <string>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <runner/runner.h>

namespace rnexecutorch {
using namespace facebook;

class LLM {
public:
  explicit LLM(const std::string &modelSource,
               const std::string &tokenizerSource,
               std::shared_ptr<react::CallInvoker> callInvoker);

  void generate(std::string input, std::shared_ptr<jsi::Function> callback);
  void interrupt();
  void unload() noexcept;
  std::size_t getMemoryLowerBound() const noexcept;

private:
  size_t memorySizeLowerBound;
  std::unique_ptr<example::Runner> runner;
  std::shared_ptr<react::CallInvoker> callInvoker;
};
} // namespace rnexecutorch
