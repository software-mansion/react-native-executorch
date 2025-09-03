#include "CTCLabelConverter.h"
#include <algorithm>
#include <optional>

namespace rnexecutorch::models::ocr {
CTCLabelConverter::CTCLabelConverter(const std::string &characters)
    : ignoreIdx(0),
      character({"[blank]"}) // blank character is ignored character (index 0).
{
  for (size_t i = 0; i < characters.length();) {
    size_t char_len = 0;
    unsigned char first_byte = characters[i];

    if ((first_byte & 0x80) == 0) { // 0xxxxxxx -> 1-byte character
      char_len = 1;
    } else if ((first_byte & 0xE0) == 0xC0) { // 110xxxxx -> 2-byte character
      char_len = 2;
    } else if ((first_byte & 0xF0) == 0xE0) { // 1110xxxx -> 3-byte character
      char_len = 3;
    } else if ((first_byte & 0xF8) == 0xF0) { // 11110xxx -> 4-byte character
      char_len = 4;
    } else {
      // Invalid UTF-8 start byte, treat as a single byte character to avoid
      // infinite loop
      char_len = 1;
    }

    // Ensure we don't read past the end of the string
    if (i + char_len <= characters.length()) {
      character.push_back(characters.substr(i, char_len));
    }
    i += char_len;
  }
}

std::vector<std::string>
CTCLabelConverter::decodeGreedy(const std::vector<int32_t> &textIndex,
                                size_t length) {
  /*
   The current strategy used for decoding is greedy approach
   which iterates through the list of indices and process
   each index using following steps:
    1. Ignore if idx == 0
    2. Ignore if idx is the same as last idx
    3. decode idx -> char and append it to returned text.

   Note that ignoring repeated indices, does not mean decoding
   won't handle repeated letters in a word, since in most cases
   actual chars are already seperated by blank tokens.
  */
  std::vector<std::string> texts;
  size_t index = 0;

  while (index < textIndex.size()) {
    size_t segmentLength = std::min(length, textIndex.size() - index);

    std::vector<int32_t> subArray(textIndex.begin() + index,
                                  textIndex.begin() + index + segmentLength);

    std::string text;

    if (!subArray.empty()) {
      std::optional<int32_t> lastChar;
      for (int32_t currentChar : subArray) {
        bool isRepeated =
            lastChar.has_value() && lastChar.value() == currentChar;
        bool isIgnored = currentChar == ignoreIdx;
        lastChar = currentChar;

        if (currentChar >= 0 &&
            currentChar < static_cast<int32_t>(character.size()) &&
            !isRepeated && !isIgnored) {
          text += character[currentChar];
        }
      }
    }

    texts.push_back(std::move(text));
    index += segmentLength;

    if (segmentLength < length) {
      break;
    }
  }

  return texts;
}
} // namespace rnexecutorch::models::ocr
