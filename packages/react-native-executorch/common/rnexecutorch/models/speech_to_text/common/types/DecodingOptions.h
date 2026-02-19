#pragma once

#include <optional>
#include <string>

namespace rnexecutorch::models::speech_to_text {

struct DecodingOptions {
  explicit DecodingOptions(const std::string &language, bool verbose = false)
      : language(language.empty() ? std::nullopt : std::optional(language)),
        verbose(verbose) {}

  std::optional<std::string> language;
  bool verbose;
};

} // namespace rnexecutorch::models::speech_to_text
