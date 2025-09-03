#pragma once

#include <optional>
#include <string>

namespace rnexecutorch::models::speech_to_text::types {

struct DecodingOptions {
  explicit DecodingOptions(const std::string &language)
      : language(language.empty() ? std::nullopt
                                  : std::optional<std::string>(language)) {}

  const std::optional<std::string> language;
};

} // namespace rnexecutorch::models::speech_to_text::types
