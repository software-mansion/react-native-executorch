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
#include <algorithm>
#include <memory>
#include <optional>
#include <string>
#include <vector>

// Third Party
#include <nlohmann/json.hpp>
#include <re2/re2.h>

namespace tokenizers {

// -- Base ---------------------------------------------------------------------

/**
 * Base class for all token decoders
 */
class TokenDecoder {
public:
  /* -- Types -- */

  /** Shared pointer type */
  typedef std::shared_ptr<TokenDecoder> Ptr;

  /* -- Virtual Methods -- */

  /** Decode a sequence of tokens into another sequence of tokens
   *
   * This is the primary virtual method that all decoders must implement. It may
   * change the size/layout of tokens between the input and output vectors.
   *
   * @param token: The pre-decoding token string
   *
   * @returns decoded: The decoded token string
   */
  virtual std::vector<std::string>
  decode(const std::vector<std::string> &tokens) const = 0;

  // virtual destructor
  virtual ~TokenDecoder() = default;

}; // end class TokenDecoder

// -- Factory ------------------------------------------------------------------

/**
 * Factory and config class for creating a new TokenDecoder
 */
class TokenDecoderConfig {
public:
  /**
   * The Type name string matching from decoders
   * https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/decoders/mod.rs#L55
   */
  std::string type;

  // Parameters for Replace decoder
  std::string replace_pattern;
  std::string replace_content;

  // Parameters for Sequence decoder
  std::vector<nlohmann::json> sequence_decoders;

  // Parameters for Strip decoder
  std::string strip_content;
  size_t strip_start;
  size_t strip_stop;

  /*----------------*/
  /* Public methods */
  /*----------------*/

  /**
   * Construct with the type
   */
  explicit TokenDecoderConfig(std::string type = "");

  /**
   * Construct the pre tokenizer instance from the member data
   */
  TokenDecoder::Ptr create() const;

  /**
   * Populate from a json config file
   */
  TokenDecoderConfig &parse_json(const nlohmann::json &json_config);
}; // end class TokenDecoderConfig

// -- ByteLevel ----------------------------------------------------------------
// Used by tokenizers
// CITE:
// https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/pre_tokenizers/byte_level.rs

class ByteLevelTokenDecoder : public TokenDecoder {
public:
  std::vector<std::string>
  decode(const std::vector<std::string> &tokens) const override;

}; // end class ByteLevelTokenDecoder

// -- Replace ------------------------------------------------------------------
// Replaces a pattern with a replacement string

class ReplaceTokenDecoder : public TokenDecoder {
public:
  explicit ReplaceTokenDecoder(const std::string &pattern,
                               const std::string &content);
  std::vector<std::string>
  decode(const std::vector<std::string> &tokens) const override;

private:
  std::string pattern_;
  std::string content_;
}; // end class ReplaceTokenDecoder

// -- ByteFallback -------------------------------------------------------------
// Handles byte fallback decoding

class ByteFallbackTokenDecoder : public TokenDecoder {
public:
  std::vector<std::string>
  decode(const std::vector<std::string> &tokens) const override;

}; // end class ByteFallbackTokenDecoder

// -- Fuse --------------------------------------------------------------------
// Fuses tokens together

class FuseTokenDecoder : public TokenDecoder {
public:
  std::vector<std::string>
  decode(const std::vector<std::string> &tokens) const override;

}; // end class FuseTokenDecoder

// -- Strip ------------------------------------------------------------------
// Strips characters from tokens

class StripTokenDecoder : public TokenDecoder {
public:
  explicit StripTokenDecoder(const std::string &content_str, size_t start,
                             size_t stop);
  std::vector<std::string>
  decode(const std::vector<std::string> &tokens) const override;

private:
  uint32_t content_;
  size_t start_;
  size_t stop_;
}; // end class StripTokenDecoder

// -- Sequence -----------------------------------------------------------------
// Applies a sequence of decoders in order

class SequenceTokenDecoder : public TokenDecoder {
public:
  explicit SequenceTokenDecoder(std::vector<TokenDecoder::Ptr> decoders);
  std::vector<std::string>
  decode(const std::vector<std::string> &tokens) const override;

private:
  std::vector<TokenDecoder::Ptr> decoders_;
}; // end class SequenceTokenDecoder

} // namespace tokenizers
