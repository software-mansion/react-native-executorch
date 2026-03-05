#pragma once

#include "Word.h"
#include <string>
#include <vector>

namespace rnexecutorch::models::speech_to_text {

/**
 * Represents the result of a speech-to-text processing step.
 *
 * @property committed Words that have been finalized and are not expected to
 * change. In streaming mode specifically, it means words obtained in two
 * consecutive transcriptions.
 * @property nonCommitted Words that are provisional and may change as more
 * input is processed.
 */
struct ProcessResult {
  std::vector<Word> committed;
  std::vector<Word> nonCommitted;
};

} // namespace rnexecutorch::models::speech_to_text
