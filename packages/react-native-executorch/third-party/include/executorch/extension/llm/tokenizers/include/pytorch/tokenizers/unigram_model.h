/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

#include <memory>
#include <optional>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include <pytorch/tokenizers/model.h>
#include <pytorch/tokenizers/regex.h>
#include <pytorch/tokenizers/result.h>
#include <pytorch/tokenizers/string_integer_map.h>

namespace tokenizers {

/**
 * Unigram (SentencePiece) model.
 *
 * Each vocabulary token has a log-probability score. Tokenization finds the
 * segmentation that maximizes the sum of scores via the Viterbi algorithm.
 *
 * JSON format in tokenizer.json:
 *   "model": {
 *     "type": "Unigram",
 *     "unk_id": 0,
 *     "vocab": [["<unk>", 0.0], ["▁hello", -5.2], ...],
 *     "byte_fallback": true
 *   }
 */
class UnigramModel : public Model {
 public:
  explicit UnigramModel(
      std::vector<std::string> pieces,
      std::vector<double> scores,
      detail::TokenMap special_token_map,
      std::unique_ptr<IRegex> special_token_regex,
      bool byte_fallback,
      std::optional<uint64_t> unk_token_id,
      std::optional<uint64_t> bos_token_id,
      std::optional<uint64_t> eos_token_id,
      std::unordered_set<std::string> rstrip_tokens = {},
      std::unordered_set<std::string> lstrip_tokens = {});

  ~UnigramModel() override = default;

  Result<std::vector<uint64_t>> tokenize(
      const std::string& piece) const override;

  Result<std::string> id_to_piece(uint64_t token) const override;
  Result<uint64_t> piece_to_id(const std::string& piece) const override;

  int32_t vocab_size() const override {
    return vocab_size_;
  }

  bool is_special_token(uint64_t token) const override;

  bool is_loaded() const override {
    return initialized_;
  }

  std::pair<std::optional<std::string>, std::string>
  split_with_allowed_special_token(const std::string& input, size_t offset)
      const override;

  bool special_token_has_rstrip(const std::string& token) const override {
    return rstrip_tokens_.count(token) > 0;
  }
  bool special_token_has_lstrip(const std::string& token) const override {
    return lstrip_tokens_.count(token) > 0;
  }

  uint64_t bos_token_id() const override {
    return bos_token_id_.value_or(0);
  }

  uint64_t eos_token_id() const override {
    return eos_token_id_.value_or(0);
  }

 private:
  // --- Trie for efficient prefix matching of vocabulary tokens ---
  struct TrieNode {
    std::unordered_map<uint8_t, size_t> children;
    int64_t token_id = -1; // -1 = no token ends at this node
  };

  void build_trie();

  // Vocabulary: indexed by token id.
  std::vector<std::string> pieces_;
  std::vector<double> scores_;
  std::unordered_map<std::string, uint64_t> piece_to_id_map_;

  // Byte trie for prefix matching during Viterbi.
  std::vector<TrieNode> trie_;

  // Special-token handling (same pattern as BPEModel / WordPieceModel).
  detail::TokenMap special_token_map_;
  std::unique_ptr<IRegex> special_token_regex_;

  bool byte_fallback_ = false;
  std::optional<uint64_t> unk_token_id_;
  std::optional<uint64_t> bos_token_id_;
  std::optional<uint64_t> eos_token_id_;
  std::unordered_set<std::string> rstrip_tokens_;
  std::unordered_set<std::string> lstrip_tokens_;

  double min_score_ = 0.0;
  int32_t vocab_size_ = 0;
  bool initialized_ = false;
};

} // namespace tokenizers
