#pragma once

#include "../common/types/Word.h"
#include <algorithm>
#include <cmath>
#include <span>
#include <string>

namespace rnexecutorch::models::speech_to_text::whisper::utils {

/**
 * Finds the largest (in number of words) overlaping fragment between word
 * vectors A (suffix) and B (prefix).
 *
 * An overlaping fragment is any fragment C, which can be simultaneously a
 * suffix of A and a prefix of B. Example: A = 'Jane likes food and playing
 * games', B = 'playing games and sleeping', the overlap fragment C = 'playing
 * games'.
 *
 * @param suffixVec An input vector, where only suffixes can overlap.
 *                  Typically the 'commited' buffer in streaming algorithm.
 * @param preffixVec An input vector, where only prefixes can overlap.
 *                   Typically the 'fresh' buffer in streaming algorithm.
 * @param maxCheckRange The maximum size of overlapping fragment. Determines the
 * range of search.
 * @param maxTimestampDiff The maximum allowed timestamp difference between
 * overlaping fragments. If exceeded, the fragment are not considered as
 * overlaping.
 * @return The size of the largest found overlaping fragment.
 */
template <typename Container>
inline size_t findLargestOverlapingFragment(const Container &suffixVec,
                                            const Container &prefixVec,
                                            size_t maxCheckRange = 10,
                                            float maxTimestampDiff = 100.f) {
  size_t range = std::min({suffixVec.size(), prefixVec.size(), maxCheckRange});

  if (range == 0) {
    return 0;
  }

  // Iterate backwards from the largest possible overlap size down to 1.
  // i starts at the index where the suffix of length 'range' begins.
  for (size_t i = suffixVec.size() - range; i < suffixVec.size(); ++i) {
    // We search for overlaps by searching for the first word of prefixVec
    if (suffixVec[i].content == prefixVec[0].content) {
      size_t calculatedSize = suffixVec.size() - i;

      // Optimization: Check if the last elements match before full comparison
      if (prefixVec[calculatedSize - 1].content != suffixVec.back().content) {
        continue;
      }

      bool isEqual = std::equal(
          suffixVec.begin() + i, suffixVec.end(), prefixVec.begin(),
          [maxTimestampDiff](const Word &sWord, const Word &pWord) {
            return sWord.content == pWord.content &&
                   std::fabs(sWord.start - pWord.start) <= maxTimestampDiff &&
                   std::fabs(sWord.end - pWord.end) <= maxTimestampDiff;
          });

      if (isEqual) {
        return calculatedSize;
      }
    }
  }

  return 0;
}

} // namespace rnexecutorch::models::speech_to_text::whisper::utils