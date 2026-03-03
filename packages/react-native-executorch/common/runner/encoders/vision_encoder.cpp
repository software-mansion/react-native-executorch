// common/runner/encoders/vision_encoder.cpp
#include "vision_encoder.h"

#include <rnexecutorch/Error.h>
#include <runner/constants.h>
#include <runner/image.h>

namespace executorch::extension::llm {

using ::executorch::runtime::Error;
using ::executorch::runtime::EValue;
using ::executorch::runtime::Result;

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
  if (method_names_result->count(kVisionEncoderMethod) == 0) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::InvalidConfig,
        "Model does not support vision: 'vision_encoder' method not found. "
        "Check that the .pte file matches the declared capabilities.");
  }
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
  const Image &image = input.get_image();
  auto method_meta_result = module_->method_meta(kVisionEncoderMethod);
  if (!method_meta_result.ok()) {
    return method_meta_result.error();
  }
  auto &method_meta = *method_meta_result;
  auto input_meta_result = method_meta.input_tensor_meta(0);
  if (!input_meta_result.ok()) {
    return input_meta_result.error();
  }
  auto expected_dims = input_meta_result->sizes();
  auto image_tensor_result =
      image.toTensor(/*with_batch=*/expected_dims.size() == 4);
  if (!image_tensor_result.ok()) {
    return image_tensor_result.error();
  }
  auto result = module_->execute(kVisionEncoderMethod, *image_tensor_result);
  if (!result.ok()) {
    return result.error();
  }
  return (*result)[0];
}

} // namespace executorch::extension::llm
