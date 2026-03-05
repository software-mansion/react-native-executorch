#include "LLM.h"

#include <executorch/extension/tensor/tensor.h>
#include <filesystem>
#include <map>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/threads/GlobalThreadPool.h>
#include <runner/encoders/vision_encoder.h>
#include <runner/image.h>
#include <runner/multimodal_runner.h>
#include <runner/text_runner.h>

namespace rnexecutorch::models::llm {
namespace llm = ::executorch::extension::llm;
namespace fs = std::filesystem;
using namespace facebook;
using executorch::extension::module::Module;
using executorch::runtime::Error;

// LFM2-VL vision encoder expects [1, 3, 512, 512] NCHW float32, values [0,255]
static constexpr int kImageSize = 512;
static constexpr int kImageChannels = 3;

static llm::Image loadImageForVLM(const std::string &imagePath) {
  cv::Mat mat = image_processing::readImage(imagePath);
  cv::resize(mat, mat, cv::Size(kImageSize, kImageSize));
  cv::cvtColor(mat, mat, cv::COLOR_BGR2RGB);

  std::vector<float> chw(kImageChannels * kImageSize * kImageSize);
  const int pixelCount = kImageSize * kImageSize;
  for (int i = 0; i < pixelCount; ++i) {
    cv::Vec3b px = mat.at<cv::Vec3b>(i / kImageSize, i % kImageSize);
    for (int c = 0; c < kImageChannels; ++c) {
      chw[c * pixelCount + i] = static_cast<float>(px[c]);
    }
  }
  return llm::Image(std::move(chw), kImageSize, kImageSize, kImageChannels);
}

const llm::Image &LLM::getOrLoadImage(const std::string &path) {
  auto it = imageCache_.find(path);
  if (it != imageCache_.end()) {
    return it->second;
  }
  return imageCache_.emplace(path, loadImageForVLM(path)).first->second;
}

LLM::LLM(const std::string &modelSource, const std::string &tokenizerSource,
         std::vector<std::string> capabilities,
         std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker, Module::LoadMode::File) {

  if (capabilities.empty()) {
    runner_ = std::make_unique<example::TextRunner>(std::move(module_),
                                                    tokenizerSource);
  } else {
    std::map<llm::MultimodalType, std::unique_ptr<llm::IEncoder>> encoders;
    for (const auto &cap : capabilities) {
      if (cap == "vision") {
        encoders[llm::MultimodalType::Image] =
            std::make_unique<llm::VisionEncoder>(module_.get());
      }
    }
    runner_ = std::make_unique<example::MultimodalRunner>(
        std::move(module_), tokenizerSource, std::move(encoders));
  }

  auto loadResult = runner_->load();
  if (loadResult != Error::Ok) {
    throw RnExecutorchError(loadResult, "Failed to load LLM runner");
  }

  memorySizeLowerBound = fs::file_size(fs::path(modelSource)) +
                         fs::file_size(fs::path(tokenizerSource));
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

std::string LLM::generate(std::string prompt,
                          std::vector<std::string> imagePaths,
                          std::shared_ptr<jsi::Function> callback) {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Runner is not loaded");
  }
  if (!dynamic_cast<example::MultimodalRunner *>(runner_.get())) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "This is a text-only model. Call generate(prompt, cb).");
  }

  // Split rendered prompt on "<image>" placeholders and interleave with images.
  static constexpr const char *kImageToken = "<image>";
  static constexpr size_t kImageTokenLen = 7; // strlen("<image>")

  std::vector<llm::MultimodalInput> inputs;
  size_t imageIdx = 0;
  size_t searchPos = 0;

  while (true) {
    size_t found = prompt.find(kImageToken, searchPos);
    if (found == std::string::npos) {
      // Remaining text after last image (or entire prompt if no images)
      if (searchPos < prompt.size()) {
        inputs.push_back(llm::make_text_input(prompt.substr(searchPos)));
      }
      break;
    }
    // Text segment before this placeholder
    if (found > searchPos) {
      inputs.push_back(
          llm::make_text_input(prompt.substr(searchPos, found - searchPos)));
    }
    // Image at this position
    if (imageIdx >= imagePaths.size()) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::InvalidUserInput,
          "More <image> placeholders in prompt than image paths provided");
    }
    const llm::Image &img = getOrLoadImage(imagePaths[imageIdx++]);
    inputs.push_back(llm::make_image_input(img));
    searchPos = found + kImageTokenLen;
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

  auto error = runner_->generate_internal(inputs, nativeCallback);
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
  imageCache_.clear();
}

size_t LLM::getGeneratedTokenCount() const noexcept {
  if (!runner_ || !runner_->is_loaded())
    return 0;
  return runner_->stats_.num_generated_tokens;
}

size_t LLM::getPromptTokenCount() const noexcept {
  if (!runner_ || !runner_->is_loaded())
    return 0;
  return runner_->stats_.num_prompt_tokens;
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

int32_t LLM::getMaxContextLength() const {
  if (!runner_ || !runner_->is_loaded()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::ModuleNotLoaded,
        "Can't get context length from a model that's not loaded");
  }
  return runner_->get_max_context_length();
}

void LLM::unload() noexcept { runner_.reset(nullptr); }

} // namespace rnexecutorch::models::llm
