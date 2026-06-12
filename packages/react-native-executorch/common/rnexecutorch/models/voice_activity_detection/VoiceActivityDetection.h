#pragma once

#include <condition_variable>
#include <cstddef>
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <mutex>
#include <span>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include "rnexecutorch/models/BaseModel.h"
#include "rnexecutorch/models/voice_activity_detection/Constants.h"
#include "rnexecutorch/models/voice_activity_detection/Types.h"

namespace rnexecutorch {
namespace models::voice_activity_detection {

using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class VoiceActivityDetection : public BaseModel {
public:
  VoiceActivityDetection(const std::string &modelSource,
                         std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::vector<types::Segment>
  generate(std::span<float> waveform, uint32_t mergeGap = 0) const;

  /**
   * Initializes the streaming procedure, which performs
   * a continuous detection on live expanding audio buffer.
   *
   * @param callback JS side callback to pass the results with.
   * @param timeout Specifies (in miliseconds) how much does streamer wait
   * between model inferences.
   * @param detectionMargin Specifies (in miliseconds) how far the last detected
   * speech segment can be to still be considered as ongoing speech.
   */
  void stream(std::shared_ptr<jsi::Function> callback, uint32_t timeout, uint32_t detectionMargin);

  /**
   * When called, stops the streaming procedure.
   */
  void streamStop();

  /**
   * Adds a new audio chunk to the streaming buffer.
   */
  void streamInsert(std::span<const float> audio);

private:
  std::vector<std::array<float, constants::kPaddedWindowSize>>
  preprocess(std::span<float> waveform) const;
  std::vector<types::Segment> postprocess(const std::vector<float> &scores, float threshold,
                                          uint32_t mergeGap) const;

  std::shared_ptr<react::CallInvoker> callInvoker_;

  // Streaming buffer
  std::vector<float> audioBuffer_ = {};
  mutable std::mutex audioBufferMutex_;
  // Streaming state
  std::atomic<bool> isStreaming_ = false;
  std::condition_variable streamCv_;
  std::mutex streamCvMutex_;
};

} // namespace models::voice_activity_detection

REGISTER_CONSTRUCTOR(models::voice_activity_detection::VoiceActivityDetection, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
