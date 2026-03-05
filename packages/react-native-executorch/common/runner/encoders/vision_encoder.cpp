// common/runner/encoders/vision_encoder.cpp
#include "vision_encoder.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
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
  rnexecutorch::log(
      rnexecutorch::LOG_LEVEL::Debug, "[VisionEncoder] Expected input dims:",
      std::vector<int32_t>(expected_dims.begin(), expected_dims.end()));
  auto image_tensor_result =
      image.toTensor(/*with_batch=*/expected_dims.size() == 4);
  if (!image_tensor_result.ok()) {
    return image_tensor_result.error();
  }
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[VisionEncoder] Running encode");
  auto result = module_->execute(kVisionEncoderMethod, *image_tensor_result);
  if (!result.ok()) {
    return result.error();
  }
  return (*result)[0];
}

} // namespace executorch::extension::llm
