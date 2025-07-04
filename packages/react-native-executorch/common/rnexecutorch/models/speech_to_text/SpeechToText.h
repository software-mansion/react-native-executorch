#pragma once

#include "ReactCommon/CallInvoker.h"
#include "executorch/runtime/core/evalue.h"
#include <memory>
#include <rnexecutorch/models/EncoderDecoderBase.h>
#include <span>

namespace rnexecutorch {
class SpeechToText : public EncoderDecoderBase {
public:
  SpeechToText(const std::string &encoderPath, const std::string &decoderPath,
               const std::string &modelName,
               std::shared_ptr<react::CallInvoker> callInvoker);
  void encode(std::span<float> waveform);
  int64_t decode(std::vector<int64_t> prevTokens);

private:
  const std::string modelName;
  executorch::runtime::EValue encoderOutput;
};
} // namespace rnexecutorch

// #pragma once
//
// #include "ReactCommon/CallInvoker.h"
// #include "executorch/extension/tensor/tensor_ptr.h"
// #include "executorch/runtime/core/exec_aten/exec_aten.h"
// #include <cstdint>
// #include <executorch/runtime/core/evalue.h>
// #include <memory>
// #include <rnexecutorch/data_processing/dsp.h>
// #include <rnexecutorch/models/EncoderDecoderBase.h>
// #include <span>
// #include <vector>
//
// namespace rnexecutorch {
//
// using namespace executorch::extension;
//
// struct Whisper {};
// struct Moonshine {};
//
// class SpeechToText : public EncoderDecoderBase {
// public:
//   SpeechToText(const std::string &encoderPath, const std::string
//   &decoderPath,
//                const std::string &modelName,
//                std::shared_ptr<react::CallInvoker> callInvoker)
//       : EncoderDecoderBase(encoderPath, decoderPath, callInvoker) {
//     // No preprocessor initialization needed for functional approach
//   }
//
//   void encode(std::span<float> waveform) {
//     if (modelName == "whisper") {
//       // Whisper preprocessing using functional approach
//       auto preprocessed = dsp::whisper_preprocess(waveform, 512, 160);
//       auto numFrames = preprocessed.size() / 256;
//       auto inputShape = {static_cast<int32_t>(numFrames), 256};
//       auto inputTensor = make_tensor_ptr(inputShape,
//       preprocessed.data(),
//                                          executorch::aten::ScalarType::Float);
//
//       auto forwardResult = encoder_->forward(inputTensor);
//       if (!forwardResult.ok()) {
//         throw std::runtime_error(
//             "Forward failed while encoding, error code: " +
//             std::to_string(static_cast<int>(forwardResult.error())));
//       }
//       encoderOutput_ = forwardResult.get().at(0).toTensor();
//
//     } else if constexpr (std::is_same_v<ModelType, Moonshine>) {
//       // Moonshine - no preprocessing, direct tensor creation
//       std::vector<int32_t> sizes = {1,
//       static_cast<int32_t>(waveform.size())}; auto inputTensor =
//       make_tensor_ptr(sizes, waveform.data(),
//                                          executorch::aten::ScalarType::Float);
//
//       auto result = encoder_->forward(inputTensor);
//       if (!result.ok()) {
//         throw std::runtime_error(
//             "Encoding failed on forward call, error code: " +
//             std::to_string(static_cast<int>(result.error())));
//       }
//       encoderOutput_ = result.get().at(0);
//     }
//   }
//
//   int64_t decode(std::vector<int64_t> prevTokens) {
//     auto encodings = encoderOutput_;
//     auto prevTokensTensor =
//         make_tensor_ptr({1, static_cast<int>(prevTokens.size())},
//                         prevTokens.data(),
//                         executorch::aten::ScalarType::Long);
//
//     if constexpr (std::is_same_v<ModelType, Whisper>) {
//       // Whisper decoding (implementation depends on your decoder
//       model) auto decoderOutput = decoder_->forward({prevTokensTensor,
//       encodings}); if (!decoderOutput.ok()) {
//         throw std::runtime_error(
//             "Decoding failed on forward call, error code: " +
//             std::to_string(static_cast<int>(decoderOutput.error())));
//       }
//       auto outputTensor = decoderOutput.get().at(0).toTensor();
//       const int64_t *data = outputTensor.const_data_ptr<int64_t>();
//       int innerDim = outputTensor.sizes()[1];
//       return data[innerDim - 1];
//
//     } else if constexpr (std::is_same_v<ModelType, Moonshine>) {
//       // Moonshine decoding
//       auto decoderOutput =
//           decoder_->execute("forward_cached", {prevTokensTensor,
//           encodings});
//       if (!decoderOutput.ok()) {
//         throw std::runtime_error(
//             "Decoding failed on forward call, error code: " +
//             std::to_string(static_cast<int>(decoderOutput.error())));
//       }
//       auto outputTensor = decoderOutput.get().at(0).toTensor();
//       int innerDim = outputTensor.sizes()[1];
//       const int64_t *data = outputTensor.const_data_ptr<int64_t>();
//       return data[innerDim - 1];
//     }
//
//     return 0; // Should never reach here
//   }
//
// private:
//   executorch::runtime::EValue encoderOutput_;
// };
//
// // Type aliases for convenience
// using WhisperSTT = SpeechToText<Whisper>;
// using MoonshineSTT = SpeechToText<Moonshine>;
//
// } // namespace rnexecutorch
