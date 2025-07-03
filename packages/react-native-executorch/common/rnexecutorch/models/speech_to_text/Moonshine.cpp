#include "executorch/extension/tensor/tensor_ptr.h"
#include <cstdint>
#include <cstring>
#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/models/EncoderDecoderBase.h>
#include <rnexecutorch/models/speech_to_text/Moonshine.h>
#include <stdexcept>
#include <string>

namespace rnexecutorch {
using namespace executorch::extension;

Moonshine::Moonshine(const std::string &encoderPath,
                     const std::string &decoderPath,
                     std::shared_ptr<react::CallInvoker> callInvoker)
    : EncoderDecoderBase(encoderPath, decoderPath, callInvoker) {};

void Moonshine::encode(std::span<float> waveform) {
  std::vector<int32_t> sizes = {1, static_cast<int32_t>(waveform.size())};
  auto input_tensor =
      make_tensor_ptr(sizes, waveform.data(), ScalarType::Float);
  auto result = encoder_->forward(input_tensor);
  if (!result.ok()) {
    throw std::runtime_error("Encoding failed on forward call, error code: " +
                             std::to_string(static_cast<int>(result.error())));
  }
  // Store the EValue holding the output tensor
  encoderOutput_ = result.get().at(0);
}

int64_t Moonshine::decode(std::vector<int64_t> prevTokens) {
  auto encodings = encoderOutput_;
  auto prevTokensTensor =
      make_tensor_ptr({1, static_cast<int>(prevTokens.size())},
                      prevTokens.data(), ScalarType::Long);

  auto decoderOuptut =
      decoder_->execute("forward_cached", {prevTokensTensor, encodings});

  if (!decoderOuptut.ok()) {
    throw std::runtime_error(
        "Decoding failed on forward call, error code: " +
        std::to_string(static_cast<int>(decoderOuptut.error())));
  }
  auto outputTensor = decoderOuptut.get().at(0).toTensor();
  // Output shape is [1, x] where x should be prevTokens.size() + 1
  int innerDim = outputTensor.sizes()[1];

  const int64_t *data = outputTensor.const_data_ptr<int64_t>();
  // The output is just the last, predicted token. Hence we just return the last
  // element of the output array.
  return data[innerDim - 1];
}
} // namespace rnexecutorch
