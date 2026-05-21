#include "LLM.h"

#include <executorch/extension/tensor/tensor.h>
#include <filesystem>
#include <map>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/threads/GlobalThreadPool.h>
#include <runner/encoders/audio_encoder.h>
#include <runner/encoders/vision_encoder.h>
#include <runner/multimodal_runner.h>
#include <runner/text_runner.h>

namespace rnexecutorch::models::llm {
namespace llm = ::executorch::extension::llm;
namespace fs = std::filesystem;
using namespace facebook;
using executorch::extension::module::Module;
using executorch::runtime::Error;

LLM::LLM(const std::string &modelSource, const std::string &tokenizerSource,
         std::vector<std::string> capabilities,
         std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker, Module::LoadMode::Mmap) {
  if (capabilities.empty()) {
    runner_ =
        std::make_unique<llm::TextRunner>(std::move(module_), tokenizerSource);
  } else {
    std::map<llm::MultimodalType, std::unique_ptr<llm::IEncoder>> encoders;
    for (const auto &cap : capabilities) {
      if (cap == "vision") {
        encoders[llm::MultimodalType::Image] =
            std::make_unique<llm::VisionEncoder>(*module_);
      } else if (cap == "audio") {
        encoders[llm::MultimodalType::Audio] =
            std::make_unique<llm::AudioEncoder>(*module_);
      }
    }
    runner_ = std::make_unique<llm::MultimodalRunner>(
        std::move(module_), tokenizerSource, std::move(encoders));
  }

  auto loadResult = runner_->load();
  if (loadResult != Error::Ok) {
    throw RnExecutorchError(loadResult, "Failed to load LLM runner");
  }

  // I am purposefully not adding file size of the model here. The reason is
  // that Hermes would crash the app if we try to alloc too much memory here.
  // Also, given we're using mmap, the true memory consumption of a model is not
  // really equal to the size of the model. The size of the tokenizer file is a
  // hint to the GC that this object might be worth getting rid of.
  memorySizeLowerBound = fs::file_size(fs::path(tokenizerSource));
}

std::string LLM::generate(std::string input,
                          std::shared_ptr<jsi::Function> callback) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Runner is not loaded");
  }
  std::string output;
  auto nativeCallback = [this, callback, &output](const std::string &token) {
    output += token;
    if (callback && callInvoker) {
      callInvoker->invokeAsync([callback, token](jsi::Runtime &runtime) {
        callback->call(runtime, jsi::String::createFromUtf8(runtime, token));
      });
    }
  };

  auto config = llm::GenerationConfig{.echo = false, .warming = false};
  auto error = runner_->generate(input, config, nativeCallback, {});
  if (error != Error::Ok) {
    throw RnExecutorchError(error, "Failed to generate text");
  }
  return output;
}

std::string LLM::generateMultimodal(
    std::string prompt, std::shared_ptr<jsi::Function> callback,
    std::vector<std::string> imagePaths, std::string imageToken,
    std::vector<std::vector<float>> audioWaveforms, std::string audioToken) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Runner is not loaded");
  }
  if (!runner_->is_multimodal()) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "This model does not support multimodal input.");
  }
  if (imageToken.empty() && audioToken.empty()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "At least one of imageToken/audioToken must be non-empty");
  }

  // Scan the prompt once, splitting at the earliest placeholder at each step
  // so that image/audio placeholders can be freely interleaved in the prompt.
  std::vector<llm::MultimodalInput> inputs;
  size_t imageIdx = 0, audioIdx = 0, pos = 0;
  constexpr int32_t kAudioSampleRate = 16000;
  while (pos < prompt.size()) {
    size_t imgAt =
        imageToken.empty() ? std::string::npos : prompt.find(imageToken, pos);
    size_t audAt =
        audioToken.empty() ? std::string::npos : prompt.find(audioToken, pos);
    if (imgAt == std::string::npos && audAt == std::string::npos) {
      inputs.push_back(llm::make_text_input(prompt.substr(pos)));
      break;
    }
    const bool imageFirst = imgAt != std::string::npos &&
                            (audAt == std::string::npos || imgAt < audAt);
    size_t at = imageFirst ? imgAt : audAt;
    if (at > pos) {
      inputs.push_back(llm::make_text_input(prompt.substr(pos, at - pos)));
    }
    if (imageFirst) {
      if (imageIdx >= imagePaths.size()) {
        throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                                "More '" + imageToken +
                                    "' placeholders than image paths");
      }
      inputs.push_back(llm::make_image_input(imagePaths[imageIdx++]));
      pos = at + imageToken.size();
    } else {
      if (audioIdx >= audioWaveforms.size()) {
        throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                                "More '" + audioToken +
                                    "' placeholders than audio waveforms");
      }
      inputs.push_back(llm::make_audio_input(
          std::move(audioWaveforms[audioIdx++]), kAudioSampleRate));
      pos = at + audioToken.size();
    }
  }
  if (imageIdx < imagePaths.size() || audioIdx < audioWaveforms.size()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "More image/audio paths provided than placeholders in prompt");
  }
  if (inputs.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "No inputs to generate from");
  }

  std::string output;
  auto nativeCallback = [this, callback, &output](const std::string &token) {
    output += token;
    if (callback && callInvoker) {
      callInvoker->invokeAsync([callback, token](jsi::Runtime &runtime) {
        callback->call(runtime, jsi::String::createFromUtf8(runtime, token));
      });
    }
  };

  auto error = runner_->generate(inputs, nativeCallback);
  if (error != Error::Ok) {
    throw RnExecutorchError(error, "Failed to generate multimodal response");
  }
  return output;
}

void LLM::interrupt() {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't interrupt a model that's not loaded");
  }
  runner_->stop();
}

void LLM::reset() {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't reset a model that's not loaded");
  }
  runner_->reset();
}

int32_t LLM::getGeneratedTokenCount() const noexcept {
  if (!runner_ || !runner_->is_loaded())
    return 0;
  return runner_->stats_.num_generated_tokens;
}

int32_t LLM::getPromptTokenCount() const noexcept {
  if (!runner_ || !runner_->is_loaded())
    return 0;
  return static_cast<int32_t>(runner_->stats_.num_prompt_tokens);
}

int32_t LLM::getVisualTokenCount() const {
  if (!runner_ || !runner_->is_loaded()) {
    return 0;
  }
  return static_cast<int32_t>(runner_->get_visual_token_count());
}

int32_t LLM::countTextTokens(std::string text) const {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::ModuleNotLoaded,
        "Can't count tokens from a model that's not loaded");
  }
  return runner_->count_text_tokens(text);
}

size_t LLM::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

void LLM::setCountInterval(size_t countInterval) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (countInterval == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Count interval must be greater than 0");
  }
  runner_->set_count_interval(countInterval);
}

void LLM::setTimeInterval(size_t timeInterval) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (timeInterval == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Time interval must be greater than 0");
  }
  runner_->set_time_interval(timeInterval);
}

void LLM::setTemperature(float temperature) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (temperature < 0.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Temperature must be non-negative");
  }
  runner_->set_temperature(temperature);
}

void LLM::setTopp(float topp) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (topp < 0.0f || topp > 1.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Top-p must be between 0.0 and 1.0");
  }
  runner_->set_topp(topp);
}

void LLM::setMinP(float minP) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (minP < 0.0f || minP > 1.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Min-p must be between 0.0 and 1.0");
  }
  runner_->set_min_p(minP);
}

void LLM::setRepetitionPenalty(float repetitionPenalty) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't configure a model that's not loaded");
  }
  if (repetitionPenalty < 0.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Repetition penalty must be non-negative");
  }
  runner_->set_repetition_penalty(repetitionPenalty);
}

int32_t LLM::getMaxContextLength() const {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::ModuleNotLoaded,
        "Can't get context length from a model that's not loaded");
  }
  return runner_->get_max_context_length();
}

void LLM::unload() noexcept {
  runner_.reset(nullptr);
  BaseModel::unload();
}

} // namespace rnexecutorch::models::llm
