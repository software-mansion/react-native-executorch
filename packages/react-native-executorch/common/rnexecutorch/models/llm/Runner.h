#pragma once

#include <executorch/runner/runner.h>

namespace rnexecutorch {
class LLM {
private:
  std::unique_ptr<example::Runner> runner;
  size_t externalMemoryPressure{
      0}; // TODO: the naming is off, this is just a placeholder

public:
  LLM(const std::string &modelSource, const std::string &tokenizerSource);
  void generate(std::string input, void *callback);
  size_t getExternalMemoryPressure(); // TODO: the naming is off, this is just a
                                      // placeholder
  void unload();
};
} // namespace rnexecutorch
