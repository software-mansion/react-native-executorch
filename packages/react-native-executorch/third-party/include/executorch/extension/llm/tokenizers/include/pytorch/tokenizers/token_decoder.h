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

namespace tokenizers {

// -- Base ---------------------------------------------------------------------

/**
 * Base class for all token decoders
 */
class TokenDecoder {
 public:
  /* -- Types -- */

  using Ptr = std::unique_ptr<TokenDecoder>;

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
  virtual std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const = 0;

  // virtual destructor
  virtual ~TokenDecoder() = default;

}; // end class TokenDecoder

// -- Factory ------------------------------------------------------------------

// Helper macro to standardize addition of config member fields
#define TOKEN_DECODER_CONFIG_MEMBER(type, name) \
  std::optional<type> name;                     \
  TokenDecoderConfig& set_##name(type arg) {    \
    this->name = std::move(arg);                \
    return *this;                               \
  }

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
  TOKEN_DECODER_CONFIG_MEMBER(std::string, replace_pattern)
  TOKEN_DECODER_CONFIG_MEMBER(std::string, replace_content)

  // Parameters for Sequence decoder
  TOKEN_DECODER_CONFIG_MEMBER(std::vector<nlohmann::json>, sequence_decoders)

  // Parameters for Strip decoder
  TOKEN_DECODER_CONFIG_MEMBER(std::string, strip_content)
  TOKEN_DECODER_CONFIG_MEMBER(size_t, strip_start)
  TOKEN_DECODER_CONFIG_MEMBER(size_t, strip_stop)

  // Parameters for WordPiece decoder
  TOKEN_DECODER_CONFIG_MEMBER(std::string, wordpiece_prefix)
  TOKEN_DECODER_CONFIG_MEMBER(bool, wordpiece_cleanup)

  // Parameters for Metaspace decoder
  TOKEN_DECODER_CONFIG_MEMBER(std::string, metaspace_replacement)
  TOKEN_DECODER_CONFIG_MEMBER(std::string, metaspace_prepend_scheme)

  // Parameters for BPE decoder
  TOKEN_DECODER_CONFIG_MEMBER(std::string, bpe_suffix)

  // Parameters for CTC decoder
  TOKEN_DECODER_CONFIG_MEMBER(std::string, ctc_pad_token)
  TOKEN_DECODER_CONFIG_MEMBER(std::string, ctc_word_delimiter_token)
  TOKEN_DECODER_CONFIG_MEMBER(bool, ctc_cleanup)

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
  TokenDecoderConfig& parse_json(const nlohmann::json& json_config);
}; // end class TokenDecoderConfig

// -- ByteLevel ----------------------------------------------------------------
// Used by tokenizers
// CITE:
// https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/pre_tokenizers/byte_level.rs

class ByteLevelTokenDecoder : public TokenDecoder {
 public:
  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

}; // end class ByteLevelTokenDecoder

// -- Replace ------------------------------------------------------------------
// Replaces a pattern with a replacement string

class ReplaceTokenDecoder : public TokenDecoder {
 public:
  explicit ReplaceTokenDecoder(
      const std::string& pattern,
      const std::string& content);
  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

 private:
  std::string pattern_;
  std::string content_;
}; // end class ReplaceTokenDecoder

// -- ByteFallback -------------------------------------------------------------
// Handles byte fallback decoding

class ByteFallbackTokenDecoder : public TokenDecoder {
 public:
  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

}; // end class ByteFallbackTokenDecoder

// -- Fuse --------------------------------------------------------------------
// Fuses tokens together

class FuseTokenDecoder : public TokenDecoder {
 public:
  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

}; // end class FuseTokenDecoder

// -- Strip ------------------------------------------------------------------
// Strips characters from tokens

class StripTokenDecoder : public TokenDecoder {
 public:
  explicit StripTokenDecoder(
      const std::string& content_str,
      size_t start,
      size_t stop);
  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

 private:
  uint32_t content_;
  size_t start_;
  size_t stop_;
}; // end class StripTokenDecoder

// -- WordPiece ----------------------------------------------------------------
// Used for WordPiece decoding

class WordPieceTokenDecoder : public TokenDecoder {
 public:
  explicit WordPieceTokenDecoder(
      std::string prefix = "##",
      bool cleanup = true);
  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

 private:
  std::string prefix_;
  bool cleanup_;
}; // end class WordPieceTokenDecoder

// -- Sequence -----------------------------------------------------------------
// Applies a sequence of decoders in order

class SequenceTokenDecoder : public TokenDecoder {
 public:
  explicit SequenceTokenDecoder(std::vector<TokenDecoder::Ptr> decoders);
  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

 private:
  std::vector<TokenDecoder::Ptr> decoders_;
}; // end class SequenceTokenDecoder

// -- Metaspace ----------------------------------------------------------------
// Replaces the replacement character (▁) with space and handles prepend.

class MetaspaceTokenDecoder : public TokenDecoder {
 public:
  explicit MetaspaceTokenDecoder(
      const std::string& replacement = "\xe2\x96\x81",
      const std::string& prepend_scheme = "always")
      : replacement_(replacement), prepend_scheme_(prepend_scheme) {}

  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

 private:
  std::string replacement_;
  std::string prepend_scheme_;
};

// -- BPE ----------------------------------------------------------------------
// Handles end-of-word suffix (e.g. </w>).

class BPETokenDecoder : public TokenDecoder {
 public:
  explicit BPETokenDecoder(const std::string& suffix = "</w>")
      : suffix_(suffix) {}

  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

 private:
  std::string suffix_;
};

// -- CTC ----------------------------------------------------------------------
// Connectionist Temporal Classification decoder for speech models.

class CTCTokenDecoder : public TokenDecoder {
 public:
  explicit CTCTokenDecoder(
      const std::string& pad_token = "<pad>",
      const std::string& word_delimiter_token = "|",
      bool cleanup = true)
      : pad_token_(pad_token),
        word_delimiter_token_(word_delimiter_token),
        cleanup_(cleanup) {}

  std::vector<std::string> decode(
      const std::vector<std::string>& tokens) const override;

 private:
  std::string pad_token_;
  std::string word_delimiter_token_;
  bool cleanup_;
};

} // namespace tokenizers
