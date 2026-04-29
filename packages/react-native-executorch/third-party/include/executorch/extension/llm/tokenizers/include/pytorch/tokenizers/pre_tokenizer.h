/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

// Standard
#include <memory>
#include <optional>
#include <string>
#include <vector>

// Third Party
#include <nlohmann/json.hpp>
#include <re2/re2.h>

// Local
#include <pytorch/tokenizers/regex.h>

namespace tokenizers {

// -- Base ---------------------------------------------------------------------

class PreTokenizer {
 public:
  using Ptr = std::unique_ptr<PreTokenizer>;

  virtual std::vector<std::string> pre_tokenize(
      const std::string& input) const = 0;

  virtual ~PreTokenizer() = default;
};

// -- Factory ------------------------------------------------------------------

#define PRETOKENIZER_CONFIG_MEMBER(type, name) \
  std::optional<type> name;                    \
  PreTokenizerConfig& set_##name(type arg) {   \
    this->name = std::move(arg);               \
    return *this;                              \
  }

class PreTokenizerConfig {
 public:
  std::string type;

  // Split / RegexPreTokenizer
  PRETOKENIZER_CONFIG_MEMBER(std::string, pattern)
  PRETOKENIZER_CONFIG_MEMBER(bool, is_delimiter)
  PRETOKENIZER_CONFIG_MEMBER(std::string, behavior)
  PRETOKENIZER_CONFIG_MEMBER(bool, invert)

  // Digits
  PRETOKENIZER_CONFIG_MEMBER(bool, individual_digits)

  // ByteLevel
  PRETOKENIZER_CONFIG_MEMBER(bool, add_prefix_space)
  PRETOKENIZER_CONFIG_MEMBER(bool, use_regex)

  // Metaspace
  PRETOKENIZER_CONFIG_MEMBER(std::string, replacement)
  PRETOKENIZER_CONFIG_MEMBER(std::string, prepend_scheme)
  PRETOKENIZER_CONFIG_MEMBER(bool, split)

  // CharDelimiterSplit
  PRETOKENIZER_CONFIG_MEMBER(std::string, delimiter)

  // Punctuation — reuses `behavior`

  // FixedLength
  PRETOKENIZER_CONFIG_MEMBER(size_t, length)

  // Sequence
  using Configs = std::vector<PreTokenizerConfig>;
  PRETOKENIZER_CONFIG_MEMBER(Configs, pretokenizers)

  explicit PreTokenizerConfig(std::string type = "");
  PreTokenizer::Ptr create() const;
  PreTokenizerConfig& parse_json(const nlohmann::json& json_config);
};

// -- Split (Regex) ------------------------------------------------------------

class RegexPreTokenizer : public PreTokenizer {
 public:
  explicit RegexPreTokenizer(
      const std::string& pattern,
      bool is_delimiter = false,
      const std::string& behavior = "Removed")
      : regex_(RegexPreTokenizer::create_regex_(pattern)),
        is_delimiter_(is_delimiter),
        behavior_(behavior) {}

  std::vector<std::string> pre_tokenize(const std::string& input) const;

 protected:
  static std::unique_ptr<IRegex> create_regex_(const std::string& pattern);

  std::unique_ptr<IRegex> regex_;
  const bool is_delimiter_;
  const std::string behavior_;
};

// -- Digits -------------------------------------------------------------------

class DigitsPreTokenizer : public RegexPreTokenizer {
 public:
  explicit DigitsPreTokenizer(bool individual_digits = false)
      : RegexPreTokenizer(
            individual_digits ? R"([^\p{N}]+|\p{N})"
                              : R"([^\p{N}]+|[\p{N}]+)") {}
};

// -- ByteLevel ----------------------------------------------------------------

class ByteLevelPreTokenizer : public PreTokenizer {
 public:
  ByteLevelPreTokenizer(
      bool add_prefix_space = true,
      const std::string& pattern = "",
      bool use_regex = true);
  explicit ByteLevelPreTokenizer(const std::string& pattern)
      : ByteLevelPreTokenizer(true, pattern, true) {}

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;

 private:
  const std::string pattern_;
  const bool add_prefix_space_;
  const bool use_regex_;
};

// -- Sequence -----------------------------------------------------------------

class SequencePreTokenizer : public PreTokenizer {
 public:
  explicit SequencePreTokenizer(std::vector<PreTokenizer::Ptr> pre_tokenizers);

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;

 private:
  const std::vector<PreTokenizer::Ptr> pre_tokenizers_;
};

// -- Bert ---------------------------------------------------------------------

class BertPreTokenizer : public PreTokenizer {
 public:
  BertPreTokenizer() = default;

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;
};

// -- Metaspace ----------------------------------------------------------------
// Replaces spaces with a replacement char (default ▁) and optionally splits.
// Used by SentencePiece-based HF tokenizers (T5, ALBERT, XLNet, etc.)

class MetaspacePreTokenizer : public PreTokenizer {
 public:
  enum class PrependScheme { Always, First, Never };

  explicit MetaspacePreTokenizer(
      const std::string& replacement = "\xe2\x96\x81",
      PrependScheme prepend_scheme = PrependScheme::Always,
      bool split = true)
      : replacement_(replacement),
        prepend_scheme_(prepend_scheme),
        split_(split) {}

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;

 private:
  const std::string replacement_;
  const PrependScheme prepend_scheme_;
  const bool split_;
};

// -- Whitespace ---------------------------------------------------------------
// Matches word chars and non-whitespace-non-word chars: \w+|[^\w\s]+

class WhitespacePreTokenizer : public RegexPreTokenizer {
 public:
  WhitespacePreTokenizer()
      : RegexPreTokenizer(R"(\w+|[^\w\s]+)") {}
};

// -- WhitespaceSplit ----------------------------------------------------------
// Splits on any whitespace character (removes whitespace).

class WhitespaceSplitPreTokenizer : public PreTokenizer {
 public:
  WhitespaceSplitPreTokenizer() = default;

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;
};

// -- Punctuation --------------------------------------------------------------
// Splits on punctuation characters with configurable behavior (default
// Isolated).

class PunctuationPreTokenizer : public PreTokenizer {
 public:
  explicit PunctuationPreTokenizer(const std::string& behavior = "Isolated")
      : behavior_(behavior) {}

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;

 private:
  const std::string behavior_;
};

// -- CharDelimiterSplit -------------------------------------------------------
// Splits on a single delimiter character (Removed behavior).

class CharDelimiterSplitPreTokenizer : public PreTokenizer {
 public:
  explicit CharDelimiterSplitPreTokenizer(const std::string& delimiter)
      : delimiter_(delimiter) {}

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;

 private:
  const std::string delimiter_;
};

// -- UnicodeScripts -----------------------------------------------------------
// Splits on Unicode script boundaries.

class UnicodeScriptsPreTokenizer : public PreTokenizer {
 public:
  UnicodeScriptsPreTokenizer() = default;

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;
};

// -- FixedLength --------------------------------------------------------------
// Splits into chunks of a fixed number of characters.

class FixedLengthPreTokenizer : public PreTokenizer {
 public:
  explicit FixedLengthPreTokenizer(size_t length = 5) : length_(length) {}

  std::vector<std::string> pre_tokenize(
      const std::string& input) const override;

 private:
  const size_t length_;
};

} // namespace tokenizers
