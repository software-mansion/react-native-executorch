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

VisionEncoder::VisionEncoder(::executorch::extension::Module &module)
    : module_(&module) {}

Error VisionEncoder::load() {
  if (is_loaded()) {
    return Error::Ok;
  }
  auto method_names_result = module_->method_names();
  if (!method_names_result.ok()) {
    return method_names_result.error();
  }

  if (method_names_result->count(kVisionEncoderMethod) == 0) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::InvalidConfig,
        "Model does not support vision: 'vision_encoder' method not found. "
        "Check that the .pte file matches the declared capabilities.");
  }
  return module_->load_method(kVisionEncoderMethod);
}

bool VisionEncoder::is_loaded() const noexcept {
  return module_->is_method_loaded(kVisionEncoderMethod);
}

int32_t VisionEncoder::encoderTokenCount() const noexcept {
  if (!is_loaded()) {
    return 0;
  }
  auto meta_result = module_->method_meta(kVisionEncoderMethod);
  if (!meta_result.ok()) {
    return 0;
  }
  auto output_meta = meta_result->output_tensor_meta(0);
  if (!output_meta.ok()) {
    return 0;
  }
  // Output shape is [1, num_visual_tokens, embed_dim]
  auto sizes = output_meta->sizes();
  if (sizes.size() < 2) {
    return 0;
  }
  return static_cast<int32_t>(sizes[1]);
}

Result<VisionEncoder::ImageShape> VisionEncoder::getInputShape() const {
  auto method_meta = ET_UNWRAP(module_->method_meta(kVisionEncoderMethod));
  auto input_meta = ET_UNWRAP(method_meta.input_tensor_meta(0));
  auto dims = input_meta.sizes();
  const bool with_batch = dims.size() == 4;
  const int32_t offset = with_batch ? 1 : 0;
  return ImageShape{
      .channels = static_cast<int32_t>(dims[offset]),
      .height = static_cast<int32_t>(dims[offset + 1]),
      .width = static_cast<int32_t>(dims[offset + 2]),
      .with_batch = with_batch,
  };
}

std::vector<float>
VisionEncoder::preprocessImage(const std::string &path,
                               const ImageShape &targetShape) const {
  cv::Mat mat = rnexecutorch::image_processing::readImage(path);
  cv::resize(mat, mat, cv::Size(targetShape.width, targetShape.height));
  cv::cvtColor(mat, mat, cv::COLOR_BGR2RGB);

  const int32_t pixelCount = targetShape.height * targetShape.width;
  std::vector<float> chw(targetShape.channels * pixelCount);
  for (int32_t i = 0; i < pixelCount; ++i) {
    cv::Vec3b px =
        mat.at<cv::Vec3b>(i / targetShape.width, i % targetShape.width);
    for (int32_t c = 0; c < targetShape.channels; ++c) {
      chw[c * pixelCount + i] = static_cast<float>(px[c]);
    }
  }
  return chw;
}

Result<EValue> VisionEncoder::encode(const MultimodalInput &input) {
  if (!is_loaded()) {
    return Error::InvalidState;
  }
  if (!input.is_image()) {
    return Error::InvalidArgument;
  }

  const std::string &path = input.get_image_path();

  auto it = embedding_cache_.find(path);
  if (it != embedding_cache_.end()) {
    return it->second;
  }

  auto shape = ET_UNWRAP(getInputShape());
  auto chw = preprocessImage(path, shape);

  std::vector<::executorch::aten::SizesType> sizes = {
      shape.channels, shape.height, shape.width};
  if (shape.with_batch) {
    sizes.insert(sizes.begin(), 1);
  }

  auto image_tensor = ::executorch::extension::from_blob(
      chw.data(), sizes, ::executorch::aten::ScalarType::Float);

  auto result = ET_UNWRAP(module_->execute(kVisionEncoderMethod, image_tensor));
  auto embedding = result[0];
  embedding_cache_.emplace(path, embedding);
  return embedding;
}

} // namespace executorch::extension::llm
