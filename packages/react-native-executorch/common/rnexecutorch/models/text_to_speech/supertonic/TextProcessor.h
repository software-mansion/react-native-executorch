#pragma once

#include <cstdint>
#include <string>
#include <vector>

#include "Types.h"

namespace rnexecutorch::models::text_to_speech::supertonic {

class TextProcessor {
public:
  /**
   * @param indexerSource path to unicode_indexer.json (a flat array of length
   *        65536; entry -1 means the codepoint is unsupported).
   * @param defaultLang default language code for the ``<lang>...</lang>``
   *        wrapper (e.g. "en"; "na" for unknown). Used whenever a per-call
   *        ``lang`` is not supplied. Empty disables wrapping.
   */
  TextProcessor(const std::string &indexerSource, std::string defaultLang);

  /**
   * Preprocess + tokenize a single text chunk.
   * @param text  input text.
   * @param lang  language code for this call; if empty, the default provided at
   *              construction is used. This is why language can be changed per
   *              synthesis without reloading the model.
   * @return token ids (language-token wrapped) and a matching all-ones mask.
   */
  TokenizedText process(std::u32string_view text,
                        std::string_view lang = {}) const;

  /** The default language used when a per-call lang is not supplied. */
  const std::string &defaultLang() const noexcept { return defaultLang_; }

  std::size_t getMemoryLowerBound() const noexcept;

private:
  void loadIndexer(const std::string &indexerSource);

  std::vector<int32_t> indexer_; // codepoint -> token id (or -1)
  std::string defaultLang_;
};

} // namespace rnexecutorch::models::text_to_speech::supertonic
