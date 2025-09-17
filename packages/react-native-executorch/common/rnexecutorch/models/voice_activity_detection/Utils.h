#pragma once

#include "rnexecutorch/models/voice_activity_detection/Constants.h"

#include <array>
#include <cstdint>
#include <executorch/extension/tensor/tensor.h>
#include <numbers>
#include <vector>

namespace rnexecutorch::models::voice_activity_detection::utils {

constexpr uint32_t nextPowerOfTwo(uint32_t n) noexcept {
  if (n <= 1)
    return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n + 1;
}

const std::array<float, constants::kWindowSize>
generateHammingWindow() noexcept;

size_t getNonSpeechClassProbabilites(const executorch::aten::Tensor &tensor,
                                     size_t numClass, size_t size,
                                     std::vector<float> resultVector,
                                     size_t startIdx);

} // namespace rnexecutorch::models::voice_activity_detection::utils