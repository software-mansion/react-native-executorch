#pragma once

#include <cstddef>
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
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
  generate(std::span<float> waveform) const;

private:
  std::vector<std::array<float, constants::kPaddedWindowSize>>
  preprocess(std::span<float> waveform) const;
  std::vector<types::Segment> postprocess(const std::vector<float> &scores,
                                          float threshold) const;
};
} // namespace models::voice_activity_detection

REGISTER_CONSTRUCTOR(models::voice_activity_detection::VoiceActivityDetection,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch