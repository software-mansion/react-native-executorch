#pragma once

#include <optional>
#include <string>

namespace rnexecutorch::models::speech_to_text {

struct DecodingOptions {
  DecodingOptions(const std::string &language, bool verbose = false)
      : language(language.empty() ? std::nullopt : std::optional(language)),
        verbose(verbose) {}

  std::optional<std::string> language;
  bool verbose;
};

struct StreamingOptions : public DecodingOptions {
  StreamingOptions(const std::string &language, bool verbose = false,
                   bool useVAD = false, uint32_t vadDetectionMargin = 500)
      : DecodingOptions(language, verbose), useVAD(useVAD),
        vadDetectionMargin(vadDetectionMargin) {}

  bool useVAD;
  uint32_t vadDetectionMargin;
};

} // namespace rnexecutorch::models::speech_to_text
