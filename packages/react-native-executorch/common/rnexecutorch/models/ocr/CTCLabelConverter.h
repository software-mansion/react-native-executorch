#pragma once

#include <string>
#include <unordered_map>
#include <vector>

namespace rnexecutorch::ocr {
class CTCLabelConverter {
private:
  std::vector<std::string> character;
  std::vector<int> ignoreIdx;

public:
  explicit CTCLabelConverter(const std::string &characters);

  std::vector<std::string> decodeGreedy(const std::vector<int> &textIndex,
                                        size_t length);
};
} // namespace rnexecutorch::ocr
