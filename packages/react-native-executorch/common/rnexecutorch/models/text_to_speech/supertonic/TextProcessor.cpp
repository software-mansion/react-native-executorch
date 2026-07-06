#include "TextProcessor.h"
#include "Constants.h"
#include "NfkdTable.h"

#include <rnexecutorch/Error.h>

#include <algorithm>
#include <array>
#include <fstream>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include <nlohmann/json.hpp>

namespace rnexecutorch::models::text_to_speech::supertonic {

namespace {

// --- 1. NFKD normalization ------------------------------------------------

void appendNfkd(std::u32string &out, char32_t cp) {
  if (cp > 0xFFFF) { // astral plane: no table, pass through
    out.push_back(cp);
    return;
  }
  // Binary search the sorted entry table.
  const auto *first = nfkd::kNfkdEntries;
  const auto *last = nfkd::kNfkdEntries + nfkd::kNfkdEntryCount;
  const auto *it = std::lower_bound(
      first, last, cp,
      [](const nfkd::NfkdEntry &e, char32_t v) { return e.src < v; });
  if (it != last && it->src == cp) {
    for (uint16_t i = 0; i < it->len; ++i) {
      out.push_back(nfkd::kNfkdData[it->offset + i]);
    }
  } else {
    out.push_back(cp);
  }
}

std::u32string normalizeNfkd(std::u32string_view text) {
  std::u32string out;
  out.reserve(text.size());
  for (char32_t cp : text) {
    appendNfkd(out, cp);
  }
  return out;
}

// --- 2. Emoji removal -----------------------------------------------------

bool isEmoji(char32_t c) {
  return (c >= 0x1F600 && c <= 0x1F64F) || (c >= 0x1F300 && c <= 0x1F5FF) ||
         (c >= 0x1F680 && c <= 0x1F6FF) || (c >= 0x1F700 && c <= 0x1F77F) ||
         (c >= 0x1F780 && c <= 0x1F7FF) || (c >= 0x1F800 && c <= 0x1F8FF) ||
         (c >= 0x1F900 && c <= 0x1F9FF) || (c >= 0x1FA00 && c <= 0x1FA6F) ||
         (c >= 0x1FA70 && c <= 0x1FAFF) || (c >= 0x2600 && c <= 0x26FF) ||
         (c >= 0x2700 && c <= 0x27BF) || (c >= 0x1F1E6 && c <= 0x1F1FF);
}

// --- 3/4. Symbol normalization & decorative removal -----------------------

const std::unordered_map<char32_t, char32_t> &symbolReplacements() {
  static const std::unordered_map<char32_t, char32_t> m = {
      {U'–', U'-'},  {U'‑', U'-'}, {U'—', U'-'},  {U'¯', U' '},  {U'_', U' '},
      {U'“', U'"'},  {U'”', U'"'}, {U'‘', U'\''}, {U'’', U'\''}, {U'´', U'\''},
      {U'`', U'\''}, {U'[', U' '}, {U']', U' '},  {U'|', U' '},  {U'/', U' '},
      {U'#', U' '},  {U'→', U' '}, {U'←', U' '},
  };
  return m;
}

const std::unordered_set<char32_t> &specialSymbols() {
  static const std::unordered_set<char32_t> s = {U'♥', U'☆', U'♡', U'©', U'\\'};
  return s;
}

// --- helpers --------------------------------------------------------------

void replaceAll(std::u32string &s, std::u32string_view from,
                std::u32string_view to) {
  if (from.empty()) {
    return;
  }
  size_t pos = 0;
  while ((pos = s.find(from, pos)) != std::u32string::npos) {
    s.replace(pos, from.size(), to);
    pos += to.size();
  }
}

bool isAsciiSpace(char32_t c) {
  return c == U' ' || c == U'\t' || c == U'\n' || c == U'\r' || c == U'\f' ||
         c == U'\v';
}

const std::unordered_set<char32_t> &endingPunctuation() {
  static const std::unordered_set<char32_t> s = {
      U'.', U'!', U'?',  U';',  U':',  U',',  U'\'', U'"',  U')', U']',
      U'}', U'…', U'。', U'」', U'』', U'】', U'〉', U'》', U'›', U'»'};
  return s;
}

} // namespace

TextProcessor::TextProcessor(const std::string &indexerSource,
                             std::string defaultLang)
    : defaultLang_(std::move(defaultLang)) {
  loadIndexer(indexerSource);
}

void TextProcessor::loadIndexer(const std::string &indexerSource) {
  std::ifstream in(indexerSource, std::ios::binary);
  if (!in) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Supertonic::TextProcessor] cannot open indexer: " + indexerSource);
  }
  nlohmann::json j;
  try {
    in >> j;
  } catch (const std::exception &e) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        std::string("[Supertonic::TextProcessor] malformed indexer json: ") +
            e.what());
  }
  if (!j.is_array() || j.empty()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "[Supertonic::TextProcessor] indexer must be a non-empty array");
  }
  indexer_ = j.get<std::vector<int32_t>>();
}

TokenizedText TextProcessor::process(std::u32string_view text,
                                     std::string_view lang) const {
  // 1. NFKD
  std::u32string s = normalizeNfkd(text);

  // 2-4. emoji removal, symbol normalization, decorative-symbol removal
  const auto &repl = symbolReplacements();
  const auto &special = specialSymbols();
  std::u32string t;
  t.reserve(s.size());
  for (char32_t c : s) {
    if (isEmoji(c) || special.contains(c)) {
      continue;
    }
    auto it = repl.find(c);
    t.push_back(it != repl.end() ? it->second : c);
  }
  s = std::move(t);

  // 5. abbreviation expansion (order matters, mirrors Python dict order)
  replaceAll(s, U"@", U" at ");
  replaceAll(s, U"e.g.,", U"for example, ");
  replaceAll(s, U"i.e.,", U"that is, ");

  // 6. punctuation-spacing fixes
  replaceAll(s, U" ,", U",");
  replaceAll(s, U" .", U".");
  replaceAll(s, U" !", U"!");
  replaceAll(s, U" ?", U"?");
  replaceAll(s, U" ;", U";");
  replaceAll(s, U" :", U":");
  replaceAll(s, U" '", U"'");

  // 7. duplicate-quote collapsing (runs of the same ", ' or ` -> one)
  {
    std::u32string collapsed;
    collapsed.reserve(s.size());
    for (char32_t c : s) {
      bool isQuote = (c == U'"' || c == U'\'' || c == U'`');
      if (isQuote && !collapsed.empty() && collapsed.back() == c) {
        continue;
      }
      collapsed.push_back(c);
    }
    s = std::move(collapsed);
  }

  // 8. whitespace cleanup (collapse runs to single space, strip)
  {
    std::u32string cleaned;
    cleaned.reserve(s.size());
    bool prevSpace = false;
    for (char32_t c : s) {
      if (isAsciiSpace(c)) {
        if (!prevSpace) {
          cleaned.push_back(U' ');
        }
        prevSpace = true;
      } else {
        cleaned.push_back(c);
        prevSpace = false;
      }
    }
    size_t b = cleaned.find_first_not_of(U' ');
    size_t e = cleaned.find_last_not_of(U' ');
    s = (b == std::u32string::npos) ? std::u32string()
                                    : cleaned.substr(b, e - b + 1);
  }

  // 9. trailing period
  if (s.empty() || !endingPunctuation().contains(s.back())) {
    s.push_back(U'.');
  }

  // 10. language token (per-call lang overrides the construction default)
  const std::string_view effectiveLang = lang.empty() ? defaultLang_ : lang;
  if (!effectiveLang.empty()) {
    std::u32string tag(effectiveLang.begin(), effectiveLang.end()); // ASCII
    std::u32string wrapped;
    wrapped.reserve(s.size() + 2 * tag.size() + 5);
    wrapped.push_back(U'<');
    wrapped += tag;
    wrapped.push_back(U'>');
    wrapped += s;
    wrapped.push_back(U'<');
    wrapped.push_back(U'/');
    wrapped += tag;
    wrapped.push_back(U'>');
    s = std::move(wrapped);
  }

  TokenizedText out;
  out.ids.reserve(s.size());
  for (char32_t c : s) {
    if (c >= constants::kIndexerSize) {
      continue; // unsupported (astral) codepoint
    }
    int32_t id = indexer_[c];
    if (id == constants::kUnsupportedIndex) {
      continue; // unsupported codepoint — skip (Python would reject)
    }
    out.ids.push_back(static_cast<Token>(id));
  }
  out.mask.assign(out.ids.size(), 1.0F);

  return out;
}

std::size_t TextProcessor::getMemoryLowerBound() const noexcept {
  return indexer_.size() * sizeof(int32_t);
}

} // namespace rnexecutorch::models::text_to_speech::supertonic
