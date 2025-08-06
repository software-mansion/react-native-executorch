#pragma once

#include <string>
#include <vector>

namespace rnexecutorch::ocr {
class CTCLabelConverter final {
public:
  explicit CTCLabelConverter(const std::string &characters);

  std::vector<std::string> decodeGreedy(const std::vector<int32_t> &textIndex,
                                        size_t length);

private:
  std::vector<std::string> character;
  int32_t ignoreIdx;
};
} // namespace rnexecutorch::ocr
