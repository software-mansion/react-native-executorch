#include "Utils.h"
#include "Constants.h"
#include <rnexecutorch/Error.h>

#include <algorithm>

namespace rnexecutorch::models::text_to_speech::kokoro::utils {

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