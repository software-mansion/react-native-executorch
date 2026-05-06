/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

#include <pytorch/tokenizers/tokenizer.h>
#include <memory>
#include <vector>

// Forward-declare to avoid leaking sentencepiece headers to consumers.
namespace sentencepiece {
class SentencePieceProcessor;
} // namespace sentencepiece

namespace tokenizers {

/**
 * Tokenizer backed by Google's SentencePiece library.
 *
 * Loads `.model` (protobuf) files produced by the SentencePiece trainer.
 * Used by Llama 2/3, Gemma, T5, ALBERT, XLNet, Mistral, and many others.
 */
class SPTokenizer : public Tokenizer {
 public:
  explicit SPTokenizer();
  ~SPTokenizer() override;

  Error load(const std::string& tokenizer_path) override;

  Result<std::string> id_to_piece(uint64_t token) const override;
  Result<uint64_t> piece_to_id(const std::string& text) const override;

  Result<std::vector<uint64_t>>
  encode(const std::string& input, int8_t bos, int8_t eos) const override;

  /// Streaming single-token decode (for incremental inference).
  Result<std::string> decode(
      uint64_t prev_token,
      uint64_t token,
      bool skip_special_tokens = false) const override;

  /// Batch decode: converts a full token sequence back to text.
  Result<std::string> decode(
      const std::vector<uint64_t>& tokens,
      bool skip_special_tokens = false) const;

 private:
  std::unique_ptr<sentencepiece::SentencePieceProcessor> processor_;
};

} // namespace tokenizers
