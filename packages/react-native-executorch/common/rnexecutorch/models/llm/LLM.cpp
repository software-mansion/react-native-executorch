#include "LLM.h"

#include <atomic>
#include <executorch/extension/tensor/tensor.h>
#include <filesystem>
#include <rnexecutorch/threads/GlobalThreadPool.h>

namespace rnexecutorch::models::llm {
using namespace facebook;
using executorch::extension::TensorPtr;
using executorch::runtime::Error;

LLM::LLM(const std::string &modelSource, const std::string &tokenizerSource,
         std::shared_ptr<react::CallInvoker> callInvoker)
    : runner(std::make_unique<example::Runner>(modelSource, tokenizerSource)),
      callInvoker(callInvoker) {

  auto loadResult = runner->load();
  if (loadResult != Error::Ok) {
    throw std::runtime_error("Failed to load LLM runner, error code: " +
                             std::to_string(static_cast<int>(loadResult)));
  }
  memorySizeLowerBound =
      std::filesystem::file_size(std::filesystem::path(modelSource)) +
      std::filesystem::file_size(std::filesystem::path(tokenizerSource));
}

void LLM::generate(std::string input, std::shared_ptr<jsi::Function> callback) {
  if (!runner || !runner->is_loaded()) {
    throw std::runtime_error("Runner is not loaded");
  }

  // Create a native callback that will invoke the JS callback on the JS thread
  auto nativeCallback = [this, callback](const std::string &token) {
    callInvoker->invokeAsync([callback, token](jsi::Runtime &runtime) {
      callback->call(runtime, jsi::String::createFromUtf8(runtime, token));
    });
  };

  auto error = runner->generate(input, nativeCallback, {}, false);
  if (error != executorch::runtime::Error::Ok) {
    throw std::runtime_error("Failed to generate text, error code: " +
                             std::to_string(static_cast<int>(error)));
  }
}

void LLM::interrupt() {
  if (!runner || !runner->is_loaded()) {
    throw std::runtime_error("Can't interrupt a model that's not loaded!");
  }
  runner->stop();
}

size_t LLM::getGeneratedTokenCount() const noexcept {
  if (!runner || !runner->is_loaded()) {
    return 0;
  }
  return runner->stats_.num_generated_tokens;
}

size_t LLM::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

void LLM::setCountInterval(size_t countInterval) {
  if (!runner || !runner->is_loaded()) {
    throw std::runtime_error("Can't configure a model that's not loaded!");
  }
  runner->set_count_interval(countInterval);
}

void LLM::setTimeInterval(size_t timeInterval) {
  if (!runner || !runner->is_loaded()) {
    throw std::runtime_error("Can't configure a model that's not loaded!");
  }
  runner->set_time_interval(timeInterval);
}

void LLM::unload() noexcept { runner.reset(nullptr); }

} // namespace rnexecutorch::models::llm
