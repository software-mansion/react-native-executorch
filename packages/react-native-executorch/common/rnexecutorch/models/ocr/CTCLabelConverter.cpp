#include "CTCLabelConverter.h"
#include <algorithm>
#include <optional>
#include <vector>

namespace rnexecutorch::ocr {

CTCLabelConverter::CTCLabelConverter(const std::string &characters)
    : ignoreIdx(0) {
  character = {"[blank]"}; // blank character is ignored character (index 0).

  for (size_t i = 0; i < characters.length();) {
    int char_len = 0;
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
CTCLabelConverter::decodeGreedy(const std::vector<int> &textIndex,
                                size_t length) {
  std::vector<std::string> texts;
  size_t index = 0;

  while (index < textIndex.size()) {
    size_t segmentLength = std::min(length, textIndex.size() - index);

    std::vector<int> subArray(textIndex.begin() + index,
                              textIndex.begin() + index + segmentLength);

    std::string text;

    if (!subArray.empty()) {
      std::optional<int> lastChar;

      std::vector<bool> isNotRepeated;
      isNotRepeated.reserve(subArray.size());
      isNotRepeated.push_back(true);

      std::vector<bool> isNotIgnored;
      isNotIgnored.reserve(subArray.size());

      for (size_t i = 0; i < subArray.size(); ++i) {
        int currentChar = subArray[i];
        if (i > 0) {
          bool isRepeated =
              lastChar.has_value() && lastChar.value() == currentChar;
          isNotRepeated.push_back(!isRepeated);
        }
        bool ignored = currentChar == ignoreIdx;
        isNotIgnored.push_back(!ignored);
        lastChar = currentChar;
      }

      for (size_t j = 0; j < subArray.size(); ++j) {
        if (isNotRepeated[j] && isNotIgnored[j]) {
          int charIndex = subArray[j];
          if (charIndex >= 0 && charIndex < character.size()) {
            text += character[charIndex];
          }
        }
      }
    }

    texts.push_back(text);
    index += segmentLength;

    if (segmentLength < length) {
      break;
    }
  }

  return texts;
}
} // namespace rnexecutorch::ocr
