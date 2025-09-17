#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <span>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include "rnexecutorch/models/BaseModel.h"

#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>

namespace rnexecutorch {
namespace models::voice_activity_detection {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class VoiceActivityDetection : public BaseModel {
public:
  VoiceActivityDetection(const std::string &modelSource,
                         std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<types::Segment> generate(std::span<float> waveform) const;

private:
  std::vector<std::array<float, constants::kPaddedWindowSize>>
  preprocess(std::span<float> waveform) const;
  std::vector<types::Segment> postprocess(const std::vector<float> &scores,
                                          const float threshold) const;
};
} // namespace models::voice_activity_detection

REGISTER_CONSTRUCTOR(models::voice_activity_detection::VoiceActivityDetection,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch