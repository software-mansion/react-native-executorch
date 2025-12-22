#include "Utils.h"
#include "Constants.h"
#include <algorithm>
#include <cmath>

namespace rnexecutorch::models::text_to_speech::kokoro::utils {

// Helper functions
namespace {
// Normalizes an audio sample
float normalize(float sample) {
  float v = std::abs(sample);
  return v >= constants::kAudioSilenceThreshold ? v : 0.F;
}

// Returns an index corresponding to the first (or last - if reverse=true)
// non-quiet part of an audio.
// Utilizes a moving average controled by hyperparameters from Constants.h.
template <bool reverse> size_t findAudioBound(std::span<const float> audio) {
  if (audio.empty())
    return 0;

  size_t length = audio.size();

  float sum = 0.F;
  size_t count = 0;
  size_t i = reverse ? length - 1 : 0;

  while (count < length) {
    count++;
    sum += normalize(audio[i]);
    if (count > constants::kAudioCroppingSteps)
      sum -= normalize(audio[reverse ? i + constants::kAudioCroppingSteps
                                     : i - constants::kAudioCroppingSteps]);

    if (count >= constants::kAudioCroppingSteps &&
        sum / constants::kAudioCroppingSteps >=
            constants::kAudioSilenceThreshold)
      return i;

    i = reverse ? i - 1 : i + 1;
  }

  return reverse ? 0 : length - 1;
}
} // namespace

std::span<const float> stripAudio(std::span<const float> audio, size_t margin) {
  auto lbound = findAudioBound<false>(audio);
  auto rbound = findAudioBound<true>(audio);

  lbound = lbound > margin ? lbound - margin : 0;
  rbound = std::min(rbound + margin, audio.size() - 1);

  return audio.subspan(lbound, rbound >= lbound ? rbound - lbound + 1 : 0);
}

std::vector<Token> tokenize(const std::u32string &phonemes,
                            std::optional<size_t> expectedSize) {
  if (expectedSize.has_value() && expectedSize.value() < 2)
    throw std::invalid_argument(
        "expected number of tokens cannot be lower than 2");

  // Number of tokens to populate, with and without edge pad tokens
  size_t lengthWithPadding =
      expectedSize.has_value() ? expectedSize.value() : phonemes.size() + 2;
  size_t lengthWithoutPadding = lengthWithPadding - 2;
  size_t effNoTokens = std::min(lengthWithoutPadding, phonemes.size());

  // Note that we populate tokens[1:noTokens - 1], since first and last tokens
  // are zeros (padding). Input could contain unrecognized tokens, and that's
  // why we use partition() at the end.
  std::vector<Token> tokens(lengthWithPadding, constants::kPadToken);
  std::transform(phonemes.begin(), phonemes.begin() + effNoTokens,
                 tokens.begin() + 1, [](char32_t p) -> Token {
                   return constants::kVocab.contains(p)
                              ? constants::kVocab.at(p)
                              : constants::kInvalidToken;
                 });
  auto validSeqEnd = std::partition(
      tokens.begin() + 1, tokens.begin() + effNoTokens + 1,
      [](Token t) -> bool { return t != constants::kInvalidToken; });
  std::fill(validSeqEnd, tokens.begin() + effNoTokens + 1,
            constants::kPadToken);

  return tokens;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro::utils