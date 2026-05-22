#include "Utils.h"
#include "Types.h"

namespace rnexecutorch::models::voice_activity_detection::utils {
size_t getNonSpeechClassProbabilites(const executorch::aten::Tensor &tensor,
                                     size_t numClass, size_t size,
                                     std::vector<float> &resultVector,
                                     size_t startIdx) {
  const auto *rawData = tensor.const_data_ptr<float>();
  for (size_t i = 0; i < size; i++) {
    resultVector[startIdx + i] = rawData[numClass * i];
  }
  return startIdx + size;
}

std::vector<types::Segment>
mergeSegments(const std::vector<types::Segment> &segments, size_t maxMergeGap) {
  if (segments.empty()) {
    return segments;
  }

  std::vector<types::Segment> mergedSegments;
  mergedSegments.push_back(segments[0]);

  for (size_t i = 1; i < segments.size(); ++i) {
    auto &lastMerged = mergedSegments.back();
    const auto &current = segments[i];

    if (current.start < lastMerged.end ||
        current.start - lastMerged.end <= maxMergeGap) {
      lastMerged.end = current.end;
    } else {
      mergedSegments.push_back(current);
    }
  }

  return mergedSegments;
}

} // namespace rnexecutorch::models::voice_activity_detection::utils
