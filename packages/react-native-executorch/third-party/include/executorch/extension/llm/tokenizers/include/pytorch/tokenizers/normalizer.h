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

class Normalizer {
 public:
  using Ptr = std::unique_ptr<Normalizer>;

  virtual std::string normalize(const std::string& input) const = 0;
  virtual ~Normalizer() = default;
};

// -- Factory ------------------------------------------------------------------

#define NORMALIZER_CONFIG_MEMBER(type, name) \
  std::optional<type> name;                  \
  NormalizerConfig& set_##name(type arg) {   \
    this->name = std::move(arg);             \
    return *this;                            \
  }

class NormalizerConfig {
 public:
  std::string type;

  // Replace
  NORMALIZER_CONFIG_MEMBER(std::string, pattern)
  NORMALIZER_CONFIG_MEMBER(std::string, content)

  // Sequence
  using Configs = std::vector<NormalizerConfig>;
  NORMALIZER_CONFIG_MEMBER(Configs, normalizers)

  // Prepend
  NORMALIZER_CONFIG_MEMBER(std::string, prepend)

  // BertNormalizer
  NORMALIZER_CONFIG_MEMBER(bool, clean_text)
  NORMALIZER_CONFIG_MEMBER(bool, handle_chinese_chars)
  NORMALIZER_CONFIG_MEMBER(bool, lowercase)
  NORMALIZER_CONFIG_MEMBER(bool, strip_accents)

  // Strip
  NORMALIZER_CONFIG_MEMBER(bool, strip_left)
  NORMALIZER_CONFIG_MEMBER(bool, strip_right)

  // Precompiled
  NORMALIZER_CONFIG_MEMBER(std::string, precompiled_charsmap)

  explicit NormalizerConfig(std::string type = "");
  Normalizer::Ptr create() const;
  NormalizerConfig& parse_json(const nlohmann::json& json_config);
};

// -- Replace ------------------------------------------------------------------

class ReplaceNormalizer : public Normalizer {
 public:
  explicit ReplaceNormalizer(
      const std::string& pattern,
      const std::string& content)
      : regex_(ReplaceNormalizer::create_regex_(pattern)), content_(content) {}

  std::string normalize(const std::string& input) const override;

 protected:
  static std::unique_ptr<IRegex> create_regex_(const std::string& pattern);
  std::unique_ptr<IRegex> regex_;
  const std::string content_;
};

// -- Prepend ------------------------------------------------------------------

class PrependNormalizer : public Normalizer {
 public:
  explicit PrependNormalizer(const std::string& prepend) : prepend_(prepend) {}
  std::string normalize(const std::string& input) const override;

 protected:
  const std::string prepend_;
};

// -- Sequence -----------------------------------------------------------------

class SequenceNormalizer : public Normalizer {
 public:
  explicit SequenceNormalizer(std::vector<Normalizer::Ptr> normalizers);
  std::string normalize(const std::string& input) const override;

 private:
  const std::vector<Normalizer::Ptr> normalizers_;
};

// -- NFC ----------------------------------------------------------------------

class NFCNormalizer : public Normalizer {
 public:
  NFCNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- NFD ----------------------------------------------------------------------

class NFDNormalizer : public Normalizer {
 public:
  NFDNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- NFKC ---------------------------------------------------------------------
// Note: Full NFKC requires compatibility decomposition data not available in
// our Unicode library. We approximate with NFC which handles the majority of
// real-world cases. For models that truly need NFKC (rare), consider the
// Precompiled normalizer which embeds the exact rules.

class NFKCNormalizer : public Normalizer {
 public:
  NFKCNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- NFKD ---------------------------------------------------------------------
// Same caveat as NFKC — approximated with NFD.

class NFKDNormalizer : public Normalizer {
 public:
  NFKDNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- Lowercase ----------------------------------------------------------------

class LowercaseNormalizer : public Normalizer {
 public:
  LowercaseNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- BertNormalizer -----------------------------------------------------------

class BertNormalizer : public Normalizer {
 public:
  explicit BertNormalizer(
      bool clean_text,
      bool handle_chinese_chars,
      bool lowercase,
      std::optional<bool> strip_accents)
      : clean_text_(clean_text),
        handle_chinese_chars_(handle_chinese_chars),
        lowercase_(lowercase),
        strip_accents_(strip_accents) {}

  std::string normalize(const std::string& input) const override;

 protected:
  const bool clean_text_;
  const bool handle_chinese_chars_;
  const bool lowercase_;
  const std::optional<bool> strip_accents_;
};

// -- Strip --------------------------------------------------------------------
// Strips leading/trailing whitespace.

class StripNormalizer : public Normalizer {
 public:
  explicit StripNormalizer(bool strip_left = true, bool strip_right = true)
      : strip_left_(strip_left), strip_right_(strip_right) {}
  std::string normalize(const std::string& input) const override;

 private:
  const bool strip_left_;
  const bool strip_right_;
};

// -- StripAccents -------------------------------------------------------------
// Removes combining diacritical marks (accents) via NFD decomposition.

class StripAccentsNormalizer : public Normalizer {
 public:
  StripAccentsNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- Nmt ----------------------------------------------------------------------
// Normalizes whitespace and control characters (NMT-style).

class NmtNormalizer : public Normalizer {
 public:
  NmtNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- ByteLevel ----------------------------------------------------------------
// Maps each byte to a visible UTF-8 character (GPT-2 style byte encoding).

class ByteLevelNormalizer : public Normalizer {
 public:
  ByteLevelNormalizer() = default;
  std::string normalize(const std::string& input) const override;
};

// -- Precompiled --------------------------------------------------------------
// Uses SentencePiece's precompiled charsmap (double-array trie) for
// normalization. The binary blob is stored base64-encoded in tokenizer.json.

class PrecompiledNormalizer : public Normalizer {
 public:
  explicit PrecompiledNormalizer(const std::string& precompiled_charsmap);
  ~PrecompiledNormalizer() override;
  std::string normalize(const std::string& input) const override;

 private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

} // namespace tokenizers
