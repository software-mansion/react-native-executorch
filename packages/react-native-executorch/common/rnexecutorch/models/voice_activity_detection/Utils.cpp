#include "Utils.h"

#include <numbers>
#include <numeric>

namespace rnexecutorch::models::voice_activity_detection::utils {
using namespace constants;

const std::array<float, kWindowSize> generateHammingWindow() noexcept {
  constexpr size_t size = static_cast<size_t>(constants::kWindowSize);
  std::array<float, size> window;
  for (size_t i = 0; i < size; ++i) {
    window[i] =
        0.54f -
        0.46f * std::cos((2.0f * std::numbers::pi_v<float> * i) / (size - 1));
  }
  return window;
}

size_t getNonSpeechClassProbabilites(const executorch::aten::Tensor &tensor,
                                     size_t numClass, size_t size,
                                     std::vector<float> &resultVector,
                                     size_t startIdx) {
  auto rawData = static_cast<const float *>(tensor.const_data_ptr());
  for (size_t i = 0; i < size; i++) {
    resultVector[startIdx + i] = rawData[numClass * i];
  }
  return startIdx + size;
}

} // namespace rnexecutorch::models::voice_activity_detection::utils
