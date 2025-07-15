#pragma once

#include <unordered_set>

namespace rnexecutorch::ocr {

class CTCLabelConverter {
public:
  CTCLabelConverter(const std::string &charset);
  std::vector<std::string> decodeGreedy(const std::vector<int> &textIndex,
                                        size_t length);

private:
  std::string decodeSegment(const std::vector<int> &subArray);
  std::vector<std::string> characters;
  std::unordered_set<int> ignoreIndices;
};
} // namespace rnexecutorch::ocr