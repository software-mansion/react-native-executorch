#pragma once

#include <optional>
#include <string>

class DecodingOptions {
public:
  explicit DecodingOptions(const std::string &language) {
    if (!language.empty())
      this->language = language;
  }

  std::optional<std::string> language;
};
