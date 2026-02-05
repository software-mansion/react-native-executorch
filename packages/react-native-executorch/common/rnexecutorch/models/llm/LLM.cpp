#include "LLM.h"

#include <executorch/extension/tensor/tensor.h>
#include <filesystem>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/threads/GlobalThreadPool.h>

namespace rnexecutorch::models::llm {
namespace llm = ::executorch::extension::llm;
namespace fs = std::filesystem;
using namespace facebook;
using executorch::extension::TensorPtr;
using executorch::extension::module::Module;
using executorch::runtime::Error;

LLM::LLM(const std::string &modelSource, const std::string &tokenizerSource,
         std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker, Module::LoadMode::File),
      runner(
          std::make_unique<example::Runner>(module_.get(), tokenizerSource)) {
  auto loadResult = runner->load();
  if (loadResult != Error::Ok) {
    throw RnExecutorchError(loadResult, "Failed to load LLM runner");
  }

  memorySizeLowerBound = fs::file_size(fs::path(modelSource)) +
                         fs::file_size(fs::path(tokenizerSource));
}

// TODO: add a way to manipulate the generation config with params
std::string LLM::generate(std::string input,
                          std::shared_ptr<jsi::Function> callback) {
  if (!runner || !runner->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Runner is not loaded");
  }

  std::string output;

  // Create a native callback that accumulates tokens and optionally invokes JS
  auto nativeCallback = [this, callback, &output](const std::string &token) {
    output += token;
    if (callback && callInvoker) {
      callInvoker->invokeAsync([callback, token](jsi::Runtime &runtime) {
        callback->call(runtime, jsi::String::createFromUtf8(runtime, token));
      });
    }
  };

  auto config = llm::GenerationConfig{.echo = false, .warming = false};
  auto error = runner->generate(input, config, nativeCallback, {});
  if (error != executorch::runtime::Error::Ok) {
    throw RnExecutorchError(error, "Failed to generate text");
  }

  return output;
}

void LLM::interrupt() {
  if (!runner || !runner->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't interrupt a model that's not loaded");
  }
  runner->stop();
}

size_t LLM::getGeneratedTokenCount() const noexcept {
  if (!runner || !runner->is_loaded()) {
    return 0;
  }
  return runner->stats_.num_generated_tokens;
}

size_t LLM::getPromptTokenCount() const noexcept {
  if (!runner || !runner->is_loaded()) {
    return 0;
  }
  return runner->stats_.num_prompt_tokens;
}

size_t LLM::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

void LLM::setCountInterval(size_t countInterval) {
  if (!runner || !runner->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (countInterval == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Count interval must be greater than 0");
  }
  runner->set_count_interval(countInterval);
}

void LLM::setTimeInterval(size_t timeInterval) {
  if (!runner || !runner->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (timeInterval == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Time interval must be greater than 0");
  }
  runner->set_time_interval(timeInterval);
}

void LLM::setTemperature(float temperature) {
  if (!runner || !runner->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (temperature < 0.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Temperature must be non-negative");
  }
  runner->set_temperature(temperature);
};

void LLM::setTopp(float topp) {
  if (!runner || !runner->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (topp < 0.0f || topp > 1.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Top-p must be between 0.0 and 1.0");
  }
  runner->set_topp(topp);
}
void LLM::unload() noexcept { runner.reset(nullptr); }

} // namespace rnexecutorch::models::llm
