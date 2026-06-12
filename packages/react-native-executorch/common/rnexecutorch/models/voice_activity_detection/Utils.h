#pragma once

#include "Types.h"
#include <cstddef>
#include <executorch/extension/tensor/tensor.h>
#include <vector>

namespace rnexecutorch::models::voice_activity_detection::utils {
size_t getNonSpeechClassProbabilites(const executorch::aten::Tensor &tensor, size_t numClass,
                                     size_t size, std::vector<float> &resultVector,
                                     size_t startIdx);

/**
 * Merges adjacent speech segments which are separated by a gap smaller than or
 * equal to the specified maximum merge gap.
 *
 * @param segments A collection of speech segments to be merged.
 * @param maxMergeGap The maximum allowed distance between two segments (in
 * samples) to qualify them for a merge.
 * @return A new collection containing the merged speech segments.
 */
std::vector<types::Segment> mergeSegments(const std::vector<types::Segment> &segments,
                                          size_t maxMergeGap);

} // namespace rnexecutorch::models::voice_activity_detection::utils
