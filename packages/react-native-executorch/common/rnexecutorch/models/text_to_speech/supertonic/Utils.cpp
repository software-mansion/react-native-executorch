#include "Utils.h"
#include "Params.h"

#include <algorithm>
#include <cmath>

namespace rnexecutorch::models::text_to_speech::supertonic::utils {

using namespace params::cropping;

namespace {

float normalize(float sample) {
  return std::max(0.0F, std::abs(sample) - kAudioSilenceThreshold);
}

template <bool reverse> size_t findAudioBound(std::span<const float> audio) {
  if (audio.empty()) {
    return 0;
  }
  const size_t length = audio.size();
  float windowSum = 0.0F;
  size_t processedCount = 0;
  size_t currentIndex = reverse ? length - 1 : 0;

  while (processedCount < length) {
    processedCount++;
    windowSum += normalize(audio[currentIndex]);

    if (processedCount > kAudioCroppingSteps) {
      const size_t oldIndex = reverse ? currentIndex + kAudioCroppingSteps
                                      : currentIndex - kAudioCroppingSteps;
      windowSum -= normalize(audio[oldIndex]);
    }

    if (processedCount >= kAudioCroppingSteps &&
        (windowSum / kAudioCroppingSteps) >= kAudioSilenceThreshold) {
      return currentIndex;
    }
    currentIndex += reverse ? -1 : 1;
  }
  return reverse ? 0 : length - 1;
}

} // namespace

std::span<const float> stripAudio(std::span<const float> audio, size_t margin) {
  if (audio.empty()) {
    return {};
  }
  size_t lbound = findAudioBound<false>(audio);
  size_t rbound = findAudioBound<true>(audio);

  lbound = (lbound > margin) ? lbound - margin : 0;
  rbound = std::min(rbound + margin, audio.size() - 1);

  const size_t strippedLength = (rbound >= lbound) ? (rbound - lbound + 1) : 0;
  return audio.subspan(lbound, strippedLength);
}

} // namespace rnexecutorch::models::text_to_speech::supertonic::utils
