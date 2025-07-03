#include "executorch/extension/tensor/tensor_ptr.h"
#include "rnexecutorch/models/EncoderDecoderBase.h"
#include <cstdint>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/models/speech_to_text/Whisper.h>

namespace rnexecutorch {
using namespace executorch::extension;

Whisper::Whisper(const std::string &encoderPath, const std::string &decoderPath,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : EncoderDecoderBase(encoderPath, decoderPath, callInvoker),
      preprocessor(512) {}

void Whisper::encode(std::span<float> waveform) {
  // TODO: finish this
  // std::vector<int32_t> sizes = {1, 80, 3000};
  // auto input_tensor = make_tensor_ptr(const executorch::aten::Tensor &tensor)
  auto preprocessed = preprocessor.preprocess(waveform, 160);
  auto numFrames = preprocessed.size() / 256;
  // auto inputShape = {numFrames, 512};
  auto inputShape = {static_cast<int32_t>(preprocessed.size()), 512};
  auto inputTensor =
      make_tensor_ptr(inputShape, preprocessed.data(), ScalarType::Float);
  auto forwardResult = encoder_->forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Forward failed while decoding, error code: " +
        std::to_string(static_cast<int>(forwardResult.error())));
  }
  log(LOG_LEVEL::Debug, "Whisper encoding successful!");
}

int64_t Whisper::decode(std::vector<int64_t>) { return 0; }
} // namespace rnexecutorch
