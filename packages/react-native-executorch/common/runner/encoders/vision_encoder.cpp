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
  auto method_names_result = module_->method_names();
  if (!method_names_result.ok() ||
      method_names_result->count(kVisionEncoderMethod) == 0) {
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
  if (!input.is_image()) {
    return Error::InvalidArgument;
  }
  const Image &image = input.get_image();
  auto image_tensor_result = image.toTensor(/*with_batch=*/true);
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
