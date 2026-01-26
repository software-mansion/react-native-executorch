/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every CLANGTIDY facebook-hte-RelativeInclude
#pragma once
#include "tokenizer.h"
#include <memory>

namespace tokenizers {

// A simple Byte Pair Encoding (BPE) Tokenizer. Note that the current C++ code
// won't work with this class, it needs to go through tokenizer.py first.
class Llama2cTokenizer : public Tokenizer {
public:
  explicit Llama2cTokenizer();
  ~Llama2cTokenizer() override;

  Error load(const std::string &tokenizer_path) override;

  Result<std::string> id_to_piece(uint64_t token) const override;
  Result<uint64_t> piece_to_id(const std::string &text) const override;

  Result<std::vector<uint64_t>> encode(const std::string &input, int8_t bos,
                                       int8_t eos) const override;

  Result<std::string> decode(uint64_t prev_token, uint64_t token,
                             bool skip_special_tokens = false) const override;

private:
  inline Error _decode_verify(uint64_t token) const {
    if (!initialized_) {
      return Error::Uninitialized;
    }
    if (token >= vocab_size_) {
      return Error::OutOfRange;
    }
    return Error::Ok;
  }
  std::unique_ptr<char *[]> vocab_ = nullptr;
  std::unique_ptr<float[]> vocab_scores_ = nullptr;
  std::unique_ptr<TokenIndex[]> sorted_vocab_ = nullptr;
  unsigned int max_token_length_ = 0;
  unsigned char byte_pieces_[512]; // stores all single-byte strings
};

} // namespace tokenizers
