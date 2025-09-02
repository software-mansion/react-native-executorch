#pragma once

#include <optional>
#include <string>

struct DecodingOptions {
  explicit DecodingOptions(const std::string &language)
      : language(language.empty() ? std::nullopt
                                  : std::optional<std::string>(language)) {}

  const std::optional<std::string> language;
};
