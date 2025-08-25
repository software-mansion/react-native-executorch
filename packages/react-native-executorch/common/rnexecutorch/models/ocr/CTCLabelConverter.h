#pragma once

#include <string>
#include <vector>

namespace rnexecutorch::models::ocr {
/*
 CTC (Connectionist Temporal Classification) Label Converter
 is used for decoding the returned list of indices by Recognizer into
 actual characters.
 For each Recognizer there is an 1:1 correspondence between
 an index and a character. CTC Label Converter operates on this
 mapping. Symbol corresponding to the first index is a [blank]
 character, meaning "no character to decode here".
 The decoder ignores [blank] char.
*/

class CTCLabelConverter final {
public:
  explicit CTCLabelConverter(const std::string &characters);

  std::vector<std::string> decodeGreedy(const std::vector<int32_t> &textIndex,
                                        size_t length);

private:
  std::vector<std::string> character;
  int32_t ignoreIdx;
};
} // namespace rnexecutorch::models::ocr
