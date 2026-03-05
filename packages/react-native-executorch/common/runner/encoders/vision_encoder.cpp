// common/runner/encoders/vision_encoder.cpp
#include "vision_encoder.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <runner/constants.h>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>

namespace executorch::extension::llm {

using ::executorch::runtime::Error;
using ::executorch::runtime::EValue;
using ::executorch::runtime::Result;

// LFM2-VL vision encoder expects [1, 3, H, W] NCHW float32, values [0, 255]
static constexpr int kImageSize = 512;
static constexpr int kImageChannels = 3;

VisionEncoder::VisionEncoder(::executorch::extension::Module *module)
    : module_(module) {}

Error VisionEncoder::load() {
  if (is_loaded()) {
    return Error::Ok;
  }
  auto method_names_result = module_->method_names();
  if (!method_names_result.ok()) {
    return method_names_result.error();
  }
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Debug,
                    "[VisionEncoder] Available methods:");
  for (const auto &name : *method_names_result) {
    auto val = module_->get(name);
    if (val.ok()) {
      rnexecutorch::log(rnexecutorch::LOG_LEVEL::Debug, " -", name, "=",
                        val->toScalar().to<int64_t>());
    } else {
      rnexecutorch::log(rnexecutorch::LOG_LEVEL::Debug, " -", name);
    }
  }

  if (method_names_result->count(kVisionEncoderMethod) == 0) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::InvalidConfig,
        "Model does not support vision: 'vision_encoder' method not found. "
        "Check that the .pte file matches the declared capabilities.");
  }
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[VisionEncoder] Loading method:", kVisionEncoderMethod);
  return module_->load_method(kVisionEncoderMethod);
}

bool VisionEncoder::is_loaded() const {
  return module_->is_method_loaded(kVisionEncoderMethod);
}

Result<EValue> VisionEncoder::encode(const MultimodalInput &input) {
  if (!is_loaded()) {
    return Error::InvalidState;
  }
  if (!input.is_image()) {
    return Error::InvalidArgument;
  }

  const std::string &path = input.get_image_path();

  // Return cached embedding if available
  auto it = embedding_cache_.find(path);
  if (it != embedding_cache_.end()) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Debug,
                      "[VisionEncoder] Cache hit for:", path);
    return it->second;
  }

  // Load and preprocess image: resize → BGR→RGB → HWC uint8 → CHW float32
  cv::Mat mat = rnexecutorch::image_processing::readImage(path);
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

  // Determine expected input shape (with or without batch dim)
  auto method_meta_result = module_->method_meta(kVisionEncoderMethod);
  if (!method_meta_result.ok()) {
    return method_meta_result.error();
  }
  auto input_meta_result = method_meta_result->input_tensor_meta(0);
  if (!input_meta_result.ok()) {
    return input_meta_result.error();
  }
  auto expected_dims = input_meta_result->sizes();
  const bool with_batch = expected_dims.size() == 4;

  std::vector<::executorch::aten::SizesType> sizes = {kImageChannels,
                                                      kImageSize, kImageSize};
  if (with_batch) {
    sizes.insert(sizes.begin(), 1);
  }

  auto image_tensor = ::executorch::extension::from_blob(
      chw.data(), sizes, ::executorch::aten::ScalarType::Float);

  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[VisionEncoder] Running encode for:", path);
  auto result = module_->execute(kVisionEncoderMethod, image_tensor);
  if (!result.ok()) {
    return result.error();
  }

  EValue embedding = (*result)[0];
  embedding_cache_.emplace(path, embedding);
  return embedding;
}

} // namespace executorch::extension::llm
