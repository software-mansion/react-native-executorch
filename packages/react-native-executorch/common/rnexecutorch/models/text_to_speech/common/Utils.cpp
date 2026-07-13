#include "Utils.h"

#include <algorithm>
#include <cmath>

namespace rnexecutorch::models::text_to_speech::utils {

namespace {

float normalize(float sample, float silenceThreshold) {
  return std::max(0.0F, std::abs(sample) - silenceThreshold);
}

template <bool reverse>
size_t findAudioBound(std::span<const float> audio, uint32_t croppingSteps,
                      float silenceThreshold) {
  if (audio.empty()) {
    return 0;
  }

  const size_t length = audio.size();
  float windowSum = 0.0F;
  size_t processedCount = 0;
  size_t currentIndex = reverse ? length - 1 : 0;

  while (processedCount < length) {
    processedCount++;
    windowSum += normalize(audio[currentIndex], silenceThreshold);

    // Maintain the sliding window sum
    if (processedCount > croppingSteps) {
      const size_t oldIndex =
          reverse ? currentIndex + croppingSteps : currentIndex - croppingSteps;
      windowSum -= normalize(audio[oldIndex], silenceThreshold);
    }

    // Check if moving average exceeds threshold
    if (processedCount >= croppingSteps &&
        (windowSum / croppingSteps) >= silenceThreshold) {
      return currentIndex;
    }

    currentIndex += reverse ? -1 : 1;
  }

  return reverse ? 0 : length - 1;
}

} // namespace

std::span<const float> stripAudio(std::span<const float> audio, size_t margin,
                                  uint32_t croppingSteps,
                                  float silenceThreshold) {
  if (audio.empty()) {
    return {};
  }

  size_t lbound = findAudioBound<false>(audio, croppingSteps, silenceThreshold);
  size_t rbound = findAudioBound<true>(audio, croppingSteps, silenceThreshold);

  // Apply margins
  lbound = (lbound > margin) ? lbound - margin : 0;
  rbound = std::min(rbound + margin, audio.size() - 1);

  const size_t strippedLength = (rbound >= lbound) ? (rbound - lbound + 1) : 0;
  return audio.subspan(lbound, strippedLength);
}

} // namespace rnexecutorch::models::text_to_speech::utils
