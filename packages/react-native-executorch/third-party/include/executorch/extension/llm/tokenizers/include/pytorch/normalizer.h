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
#include "regex.h"

namespace tokenizers {

// -- Base ---------------------------------------------------------------------

/**
 * Base class for all normalizers with a single virtual method to normalize the
 * input string
 */
class Normalizer {
public:
  /** Shared pointer type */
  typedef std::shared_ptr<Normalizer> Ptr;

  /** Normalize the input string
   *
   * This normalization may result in a string that is different from the
   * original input, therefore the resulting string will be owned by the caller.
   *
   * NOTE: Pass by value per best practice
   *  https://abseil.io/docs/cpp/guides/strings#string_view
   */
  virtual std::string normalize(const std::string &input) const = 0;

  virtual ~Normalizer() = default;
}; // end class Normalizer

// -- Factory ------------------------------------------------------------------

// Helper macro to standardize addition of config member fields
#define NORMALIZER_CONFIG_MEMBER(type, name)                                   \
  std::optional<type> name;                                                    \
  NormalizerConfig &set_##name(type arg) {                                     \
    this->name = std::move(arg);                                               \
    return *this;                                                              \
  }

/**
 * Factory and config class for creating a new Normalizer
 *
 * This class is the central method for instantiating a Normalizer instance.
 * It contains the common construction logic and config parameter names for all
 * normalizer constructor args.
 *
 * NOTE: When adding a new normalizer, you must ensure its arguments are
 *  added to this class and it's constructor is added in the implementation!
 *
 * Usage Example:
 *
 * const auto normalizer = NormalizerConfig("Replace")
 *   .set_pattern(" ")
 *   .set_content("▁")
 *   .create();
 * const auto normalized = normalizer->normalize("Hello World!");
 */
class NormalizerConfig {
public:
  /*------------------------*/
  /* Public mutable members */
  /*------------------------*/

  /**
   * The Type name string matching from tokenizers
   * https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/normalizers/mod.rs
   */
  std::string type;

  /**
   * Used by: ReplaceNormalizer
   */
  NORMALIZER_CONFIG_MEMBER(std::string, pattern)

  /**
   * Used by: ReplaceNormalizer
   */
  NORMALIZER_CONFIG_MEMBER(std::string, content)

  /**
   * Used by: SequenceNormalizer
   */
  NORMALIZER_CONFIG_MEMBER(std::vector<NormalizerConfig>, normalizers)

  /**
   * Used by: PrependNormalizer
   */
  NORMALIZER_CONFIG_MEMBER(std::string, prepend)

  /*----------------*/
  /* Public methods */
  /*----------------*/

  /**
   * Construct with the type
   */
  explicit NormalizerConfig(std::string type = "");

  /**
   * Construct the normalizer instance from the member data
   */
  Normalizer::Ptr create() const;

  /**
   * Populate from a json config file
   */
  NormalizerConfig &parse_json(const nlohmann::json &json_config);

}; // end class NormalizerConfig

// -- Replace ------------------------------------------------------------------
// Used for general-purpose string replacement normalization
// CITE:
// https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/normalizers/replace.rs

class ReplaceNormalizer : public Normalizer {
public:
  /**
   * @param pattern: The pattern to search for (can be a string or regex)
   * @param content: The replacement content
   */
  explicit ReplaceNormalizer(const std::string &pattern,
                             const std::string &content)
      : regex_(ReplaceNormalizer::create_regex_(pattern)), content_(content) {}

  /** Normalize with the stored pattern replacement */
  std::string normalize(const std::string &input) const override;

protected:
  static std::unique_ptr<IRegex> create_regex_(const std::string &pattern);

  std::unique_ptr<IRegex> regex_;
  const std::string content_;

}; // end class ReplaceNormalizer

// -- Prepend ------------------------------------------------------------------
// Used to prepend a string to the input
// CITE:
// https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/normalizers/prepend.rs

class PrependNormalizer : public Normalizer {
public:
  /**
   * @param prepend: The string to prepend
   */
  explicit PrependNormalizer(const std::string &prepend) : prepend_(prepend) {}

  /** Prepend the stored string */
  std::string normalize(const std::string &input) const override;

protected:
  const std::string prepend_;

}; // end class PrependNormalizer

// -- Sequence -----------------------------------------------------------------
// Used by tokenizers
// CITE:
// https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/normalizers/sequence.rs

class SequenceNormalizer : public Normalizer {
public:
  /**
   * @param normalizers: The sequence of owned normalizer objects to use
   */
  explicit SequenceNormalizer(std::vector<Normalizer::Ptr> normalizers);

  /** Perform normalization */
  std::string normalize(const std::string &input) const override;

private:
  const std::vector<Normalizer::Ptr> normalizers_;

}; // end class SequenceNormalizer

// -- NFC ----------------------------------------------------------------------
// Used for Unicode NFC (Normalization Form Canonical Composition) normalization
// CITE:
// https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/normalizers/unicode.rs

class NFCNormalizer : public Normalizer {
public:
  /** Default constructor */
  explicit NFCNormalizer() = default;

  /** Normalize with NFC Unicode normalization */
  std::string normalize(const std::string &input) const override;

}; // end class NFCNormalizer

} // namespace tokenizers
