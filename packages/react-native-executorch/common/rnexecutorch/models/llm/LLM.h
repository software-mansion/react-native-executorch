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
               const std::string &tokenizerSource, float temperature,
               int sampler, // Sampler is passed as INT due to JSI limitations
               std::shared_ptr<react::CallInvoker> callInvoker);

  void generate(std::string input, std::shared_ptr<jsi::Function> callback);
  void interrupt();
  void unload() noexcept;
  size_t getGeneratedTokenCount() const noexcept;
  size_t getMemoryLowerBound() const noexcept;
  void setCountInterval(size_t countInterval);
  void setTimeInterval(size_t timeInterval);
  void setTemperature(float temperature);

private:
  std::unique_ptr<example::Runner> runner;

  // A typical input for parallel processing in exported LLM model consists of 2
  // tensors of shapes [1, N] and [1], where N is the number of tokens. Hovewer,
  // some exported models require inputs of shapes [1, N] and [N], which needs
  // to be marked before using LLM runner.
  bool extended_input_mode_ = false;
};
} // namespace models::llm

// TODO: uncommnet when tested :-D
// REGISTER_CONSTRUCTOR(models::llm::LLM, std::string, std::string,
//                      std::shared_ptr<react::CallInvoker>);

REGISTER_CONSTRUCTOR(models::llm::LLM, std::string, std::string, float, int,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
