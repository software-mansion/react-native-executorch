#include "Utils.h"

namespace rnexecutorch::models::voice_activity_detection::utils {
size_t getNonSpeechClassProbabilites(const executorch::aten::Tensor &tensor,
                                     size_t numClass, size_t size,
                                     std::vector<float> &resultVector,
                                     size_t startIdx) {
  const auto* rawData = tensor.const_data_ptr<float>();
  for (size_t i = 0; i < size; i++) {
    resultVector[startIdx + i] = rawData[numClass * i];
  }
  return startIdx + size;
}

} // namespace rnexecutorch::models::voice_activity_detection::utils
