#include "CTCLabelConverter.h"

namespace rnexecutorch::ocr {
CTCLabelConverter::CTCLabelConverter(const std::string &charset) {
  characters = {"[blank]"}; // blank character is ignored character. It is the
                            // character with index 0.
  for (char c : charset) {
    characters.emplace_back(1, c); // converts char to string
  }
  ignoreIndices = {0};
}

std::string CTCLabelConverter::decodeSegment(const std::vector<int> &subArray) {
  std::string text;
  int lastChar = -1;

  for (size_t i = 0; i < subArray.size(); ++i) {
    int currentChar = subArray[i];
    bool isRepeated = lastChar == currentChar;
    bool isIgnored = (ignoreIndices.count(currentChar) > 0);

    if (!isRepeated && !isIgnored) {
      if (currentChar >= 0 &&
          currentChar < static_cast<int>(characters.size())) {
        text += characters[currentChar];
      }
    }
    lastChar = currentChar;
  }
  return text;
}

std::vector<std::string>
CTCLabelConverter::decodeGreedy(const std::vector<int> &textIndex,
                                size_t length) {
  /*
  Greedy approach to decoding indices vector returned by Recognizer to text.
  Ignores repeats.
  @param `length` currently serve no purpose, however it could be used to
  "split" decoded text into smaller fragments, each of size 'length',
  represented as next elements of returned vector. Currently we always pass
  length = textIndex.size(), therefore the whole text is decoded at once and the
  returned vector has size one.
  */
  std::vector<std::string> texts;
  size_t index = 0;

  while (index < textIndex.size()) {
    size_t segmentLength = std::min(length, textIndex.size() - index);

    std::vector<int> subArray(textIndex.begin() + index,
                              textIndex.begin() + index + segmentLength);

    auto text = decodeSegment(subArray);

    texts.push_back(text);
    index += segmentLength;

    if (segmentLength < length) {
      break;
    }
  }

  return texts;
}
} // namespace rnexecutorch::ocr