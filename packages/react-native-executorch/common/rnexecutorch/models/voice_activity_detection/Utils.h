#pragma once

#include <cstddef>
#include <executorch/extension/tensor/tensor.h>
#include <vector>

namespace rnexecutorch::models::voice_activity_detection::utils {
size_t getNonSpeechClassProbabilites(const executorch::aten::Tensor &tensor,
                                     size_t numClass, size_t size,
                                     std::vector<float> &resultVector,
                                     size_t startIdx);

} // namespace rnexecutorch::models::voice_activity_detection::utils