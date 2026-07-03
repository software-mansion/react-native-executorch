#pragma once

#include <cstdint>
#include <string>
#include <vector>

#include "Types.h"

namespace rnexecutorch::models::text_to_speech::supertonic {

/**
 * Port of ``supertonic_torch.pipeline.UnicodeProcessor``.
 *
 * Reproduces the exact preprocessing the model was trained with:
 *   1. Unicode NFKD normalization (see NfkdTable.h)
 *   2. emoji removal
 *   3. symbol normalization (dashes, smart quotes, ...)
 *   4. decorative-symbol removal
 *   5. abbreviation expansion (@, e.g., i.e.)
 *   6. punctuation-spacing fixes
 *   7. duplicate-quote collapsing
 *   8. whitespace cleanup
 *   9. trailing period insertion
 *   10. language-token wrapping: ``<lang>text</lang>``
 * then maps each codepoint through the unicode indexer to a token id.
 */
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

  /** Full preprocessing (steps 1-10) without tokenization — exposed for tests.
   */
  std::u32string preprocess(std::u32string_view text,
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
