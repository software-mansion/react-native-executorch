/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @file
 * Tokenizer interface declaration.
 */

#pragma once

#include "error.h"
#include "result.h"
#include <string>
#include <vector>

namespace tokenizers {

struct TokenIndex {
  const char *str;
  int32_t id;
};

class Tokenizer {
public:
  explicit Tokenizer() {}
  virtual ~Tokenizer() {}

  virtual Error load(const std::string &tokenizer_path) = 0;

  /**
   * Returns the raw vocabulary piece for a given token id.
   *
   * This is the exact token representation stored in the tokenizer vocabulary
   * (e.g. SentencePiece "▁hello", WordPiece "##ing", or byte-level BPE token
   * bytes). It is intended for tokenizer introspection and downstream
   * post-processing, and should not be confused with `decode()`, which may
   * apply normalization.
   *
   * @param token The token id to look up
   * @return Result containing the raw vocab piece string, or an error if the
   * token id is invalid or the tokenizer is not initialized
   */
  virtual Result<std::string> id_to_piece(uint64_t token) const = 0;

  /**
   * Returns token id for given raw vocabulary piece.
   *
   * This is the exact token representation stored in the tokenizer vocabulary
   * (e.g. SentencePiece "▁hello", WordPiece "##ing", or byte-level BPE token
   * bytes). It is intended for tokenizer introspection and downstream
   * post-processing, and should not be confused with `encode()`, which
   * applies the full tokenization pipeline including BPE for unknown pieces.
   *
   * @param text The raw vocabulary piece string to look up
   * @return Result containing the token id, or an error if the piece is not
   * found in the vocabulary or the tokenizer is not initialized
   */
  virtual Result<uint64_t> piece_to_id(const std::string &text) const = 0;

  /**
   * Encode the input string into a vector of token IDs.
   *
   * @param input The input string to tokenize
   * @param bos The number of beginning-of-sequence (BOS) tokens to prepend to
   * the result
   * @param eos The number of end-of-sequence (EOS) tokens to append to the
   * result
   * @return Result containing a vector of token IDs, or an error if encoding
   * fails
   */
  virtual Result<std::vector<uint64_t>>
  encode(const std::string &input, int8_t bos = 0, int8_t eos = 0) const = 0;

  virtual Result<std::string>
  decode(uint64_t prev_token, uint64_t token,
         bool skip_special_tokens = false) const = 0;

  // getters
  int32_t vocab_size() const { return vocab_size_; }

  uint64_t bos_tok() const { return bos_tok_; }

  uint64_t eos_tok() const { return eos_tok_; }

  virtual bool is_loaded() const { return initialized_; }

protected:
  bool initialized_ = false;
  int32_t vocab_size_ = 0;
  uint64_t bos_tok_ = 0, eos_tok_ = 0, unk_tok_ = 0;
};

} // namespace tokenizers
