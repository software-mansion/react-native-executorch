#include "Utils.h"
#include "Constants.h"
#include "Params.h"

#include <algorithm>
#include <cmath>
#include <rnexecutorch/Error.h>

namespace rnexecutorch::models::text_to_speech::kokoro::utils {

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

    // Maintain the sliding window sum
    if (processedCount > kAudioCroppingSteps) {
      const size_t oldIndex = reverse ? currentIndex + kAudioCroppingSteps
                                      : currentIndex - kAudioCroppingSteps;
      windowSum -= normalize(audio[oldIndex]);
    }

    // Check if moving average exceeds threshold
    if (processedCount >= kAudioCroppingSteps &&
        (windowSum / kAudioCroppingSteps) >= kAudioSilenceThreshold) {
      return currentIndex;
    }

    currentIndex = reverse ? currentIndex - 1 : currentIndex + 1;
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

  // Apply margins
  lbound = (lbound > margin) ? lbound - margin : 0;
  rbound = std::min(rbound + margin, audio.size() - 1);

  const size_t strippedLength = (rbound >= lbound) ? (rbound - lbound + 1) : 0;
  return audio.subspan(lbound, strippedLength);
}

std::vector<Token> tokenize(std::u32string_view phonemes,
                            std::optional<size_t> expectedSize) {
  if (expectedSize.has_value() && expectedSize.value() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "[Kokoro::Utils] Expected tokens must be >= 2");
  }

  // 1. Determine lengths (2 tokens reserved for start/end padding)
  const size_t totalLength = expectedSize.value_or(phonemes.size() + 2);
  const size_t maxPhonemes = totalLength - 2;
  const size_t effectivePhonemeCount = std::min(maxPhonemes, phonemes.size());

  // 2. Initialize with pad tokens
  std::vector<Token> tokens(totalLength, constants::kPadToken);

  // 3. Map phonemes to vocabulary tokens
  // Starting from index 1 to leave index 0 as start-padding
  std::transform(phonemes.begin(), phonemes.begin() + effectivePhonemeCount,
                 tokens.begin() + 1, [](char32_t p) -> Token {
                   return constants::kVocab.contains(p)
                              ? constants::kVocab.at(p)
                              : constants::kInvalidToken;
                 });

  // 4. Remove invalid tokens while preserving order (bubbling them to the end
  // of the content segment)
  auto validEnd = std::stable_partition(
      tokens.begin() + 1, tokens.begin() + effectivePhonemeCount + 1,
      [](Token t) { return t != constants::kInvalidToken; });

  // 5. Fill any gaps created by partitioning or sizing with pad tokens
  std::fill(validEnd, tokens.begin() + effectivePhonemeCount + 1,
            constants::kPadToken);

  return tokens;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro::utils
