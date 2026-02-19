#include "MultimodalLLM.h"

#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <filesystem>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <runner/multimodal_decoder_runner.h>
#include <runner/multimodal_prefiller.h>

namespace rnexecutorch::models::multimodal_llm {
namespace llm = ::executorch::extension::llm;
namespace fs = std::filesystem;
using namespace facebook;
using ::executorch::extension::module::Module;
using ::executorch::runtime::Error;

// LFM2-VL vision encoder expects [1, 3, 512, 512] NCHW float32, values in
// [0,255]. Normalization and patch unfolding are baked into the exported PTE.
static constexpr int kImageSize = 512;
static constexpr int kImageChannels = 3;

// LFM2-VL chat template
static constexpr const char *kChatPrefix = "<|startoftext|><|im_start|>user\n";
static constexpr const char *kChatSuffix =
    "<|im_end|>\n<|im_start|>assistant\n";

static llm::Image loadImageForLFM2(const std::string &imagePath) {
  cv::Mat mat = image_processing::readImage(imagePath);
  cv::resize(mat, mat, cv::Size(kImageSize, kImageSize));
  cv::cvtColor(mat, mat, cv::COLOR_BGR2RGB);

  // HWC uint8 → CHW float32, values in [0, 255]
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

MultimodalLLM::MultimodalLLM(const std::string &modelSource,
                             const std::string &tokenizerSource,
                             std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker, Module::LoadMode::File) {
  // Build the multimodal runner from parts — all referencing module_ owned by
  // BaseModel so we don't load the PTE twice.
  auto tokenizer = std::make_unique<tokenizers::HFTokenizer>();
  auto tokenizer_status = tokenizer->load(tokenizerSource);
  if (tokenizer_status != tokenizers::Error::Ok) {
    throw RnExecutorchError(RnExecutorchErrorCode::TokenizerError,
                            "Failed to load tokenizer");
  }

  auto io_manager = std::make_unique<llm::IOManager>(*module_);
  auto decoder_runner = std::make_unique<llm::MultimodalDecoderRunner>(
      module_.get(), io_manager.get());

  auto eos_ids = std::make_unique<std::unordered_set<uint64_t>>();
  // Read EOS ids from PTE constant method if present, default to 7 (<|im_end|>)
  auto method_names_result = module_->method_names();
  if (method_names_result.ok()) {
    if (method_names_result->count(llm::kEosIds)) {
      auto eos_result = module_->execute(llm::kEosIds);
      if (eos_result.ok()) {
        for (const auto &ev : *eos_result) {
          eos_ids->emplace(static_cast<uint64_t>(ev.toScalar().to<int64_t>()));
        }
      }
    }
  }
  if (eos_ids->empty()) {
    eos_ids->emplace(7); // <|im_end|> fallback
  }

  auto stats = std::make_unique<llm::Stats>();
  // Keep a raw pointer before moving into the runner so TextTokenGenerator
  // can safely reference the same Stats object owned by the runner.
  llm::Stats *stats_ptr = stats.get();
  auto token_generator = std::make_unique<llm::TextTokenGenerator>(
      tokenizer.get(), decoder_runner.get(), /*use_kv_cache=*/true,
      std::move(eos_ids), stats_ptr);

  auto prefiller = std::make_unique<llm::MultimodalPrefiller>(
      module_.get(), decoder_runner.get(), tokenizer.get(), io_manager.get());

  // Read metadata from the PTE
  std::unordered_map<std::string, int64_t> metadata = {
      {llm::kMaxSeqLen, 2048},
      {llm::kMaxContextLen, 2048},
  };
  if (method_names_result.ok()) {
    for (auto &pair : metadata) {
      if (method_names_result->count(pair.first)) {
        auto val = module_->get(pair.first);
        if (val.ok()) {
          pair.second = val->toScalar().to<int64_t>();
        }
      }
    }
  }

  runner_ = std::make_unique<llm::MultimodalRunner>(
      std::move(metadata), std::move(tokenizer), std::move(module_),
      std::move(decoder_runner), std::move(prefiller), std::move(io_manager),
      std::move(token_generator), std::move(stats));

  auto loadError = runner_->load();
  if (loadError != Error::Ok) {
    throw RnExecutorchError(loadError, "Failed to load multimodal runner");
  }

  memorySizeLowerBound = fs::file_size(fs::path(modelSource)) +
                         fs::file_size(fs::path(tokenizerSource));
}

std::string MultimodalLLM::generate(std::string imagePath, std::string prompt,
                                    std::shared_ptr<jsi::Function> callback) {
  if (!runner_) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Runner is not loaded");
  }

  llm::Image image = loadImageForLFM2(imagePath);

  std::vector<llm::MultimodalInput> inputs = {
      llm::make_text_input(std::string(kChatPrefix)),
      llm::make_image_input(std::move(image)),
      llm::make_text_input(prompt + kChatSuffix),
  };

  std::string output;
  auto nativeCallback = [this, &callback, &output](const std::string &token) {
    output += token;
    if (callback && callInvoker) {
      callInvoker->invokeAsync([callback, token](jsi::Runtime &runtime) {
        callback->call(runtime, jsi::String::createFromUtf8(runtime, token));
      });
    }
  };

  auto error = runner_->generate(inputs, temperature_, topp_,
                                 /*max_new_tokens=*/-1, nativeCallback);
  if (error != Error::Ok) {
    throw RnExecutorchError(error, "Failed to generate text");
  }

  runner_->reset();
  return output;
}

void MultimodalLLM::interrupt() {
  if (!runner_) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Can't interrupt a model that's not loaded");
  }
  runner_->stop();
}

size_t MultimodalLLM::getGeneratedTokenCount() const noexcept {
  if (!runner_)
    return 0;
  return static_cast<size_t>(runner_->stats().num_generated_tokens);
}

size_t MultimodalLLM::getPromptTokenCount() const noexcept {
  if (!runner_)
    return 0;
  return static_cast<size_t>(runner_->stats().num_prompt_tokens);
}

size_t MultimodalLLM::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

void MultimodalLLM::setTemperature(float temperature) {
  if (temperature < 0.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Temperature must be non-negative");
  }
  temperature_ = temperature;
}

void MultimodalLLM::setTopp(float topp) {
  if (topp < 0.0f || topp > 1.0f) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Top-p must be between 0.0 and 1.0");
  }
  topp_ = topp;
}

void MultimodalLLM::unload() noexcept { runner_.reset(nullptr); }

} // namespace rnexecutorch::models::multimodal_llm
