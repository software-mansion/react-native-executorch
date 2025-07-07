#include "ReactCommon/CallInvoker.h"
#include "executorch/extension/tensor/tensor_ptr.h"
#include "executorch/runtime/core/exec_aten/exec_aten.h"
#include "rnexecutorch/data_processing/dsp.h"
#include "rnexecutorch/models/EncoderDecoderBase.h"
#include <memory>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>
#include <stdexcept>
#include <string>
#include <vector>

namespace rnexecutorch {

using namespace ::executorch::extension;

SpeechToText::SpeechToText(const std::string &encoderPath,
                           const std::string &decoderPath,
                           const std::string &modelName,
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : EncoderDecoderBase(encoderPath, decoderPath, callInvoker),
      modelName(modelName) {}

void SpeechToText::encode(std::span<float> waveform) {
  std::vector<int32_t> inputShape;
  std::vector<float> preprocessedData; // Storage for preprocessed data
  std::span<float> modelInput;

  if (modelName == "whisper") {
    preprocessedData = dsp::whisper_preprocess(waveform); // Store the data
    modelInput = preprocessedData; // Now span points to valid data
    auto numFrames = modelInput.size() / 256;
    inputShape = {static_cast<int32_t>(numFrames), 256};
  } else if (modelName == "moonshine") {
    inputShape = {1, static_cast<int32_t>(waveform.size())};
    modelInput = waveform; // This is fine - waveform outlives the function
  } else {
    throw std::runtime_error("Unsupported model! SpeechToText encode() can "
                             "only be called on Whisper and Moonshine!");
  }

  auto modelInputTensor =
      make_tensor_ptr(inputShape, modelInput.data(), ScalarType::Float);
  auto result = encoder_->forward(modelInputTensor);
  if (!result.ok()) {
    throw std::runtime_error(
        "Forward pass failed during encoding, error code: " +
        std::to_string(static_cast<int>(result.error())));
  }

  encoderOutput = result.get().at(0);
}

int64_t SpeechToText::decode(std::vector<int64_t> prevTokens) {
  if (encoderOutput.isNone()) {
    throw std::runtime_error("Empty encodings on decode call, make sure to "
                             "call encode() prior to decode()!");
  }
  auto prevTokensTensorSizes = {1, static_cast<int>(prevTokens.size())};
  auto prevTokensScalarType =
      (modelName == "moonshine") ? ScalarType::Long : ScalarType::Int;

  auto prevTokensTensor = make_tensor_ptr(
      prevTokensTensorSizes, prevTokens.data(), prevTokensScalarType);
  auto prevTokensSizes = prevTokensTensor->sizes();

  auto sizes = encoderOutput.toTensor().sizes();
  std::vector<int64_t> prevTokensTest = {static_cast<int64_t>(1)};
  auto prevTokensTestTensor =
      make_tensor_ptr({1, 1}, prevTokensTest.data(), ScalarType::Long);

  auto decoderOutput =
      (modelName == "moonshine")
          ? decoder_->execute("forward_cached",
                              {prevTokensTensor, encoderOutput})

          : decoder_->forward({prevTokensTensor, encoderOutput});

  if (!decoderOutput.ok()) {
    throw std::runtime_error(
        "Forward pass failed during decoding, error code: " +
        std::to_string(static_cast<int>(decoderOutput.error())));
  }

  auto decoderOutputTensor = decoderOutput.get().at(0).toTensor();
  int innerDim = decoderOutputTensor.size(1);
  auto *data = decoderOutputTensor.const_data_ptr<int64_t>();
  return data[innerDim - 1];
}
} // namespace rnexecutorch
