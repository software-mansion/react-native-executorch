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
 * WordLevel model — the simplest tokenization model.
 *
 * Maps whole words directly to token IDs via vocabulary lookup.
 * Unknown words map to unk_token_id.
 *
 * JSON format in tokenizer.json:
 *   "model": {
 *     "type": "WordLevel",
 *     "vocab": {"hello": 0, "world": 1, ...},
 *     "unk_token": "[UNK]"
 *   }
 */
class WordLevelModel : public Model {
 public:
  explicit WordLevelModel(
      detail::TokenMap token_map,
      detail::TokenMap special_token_map,
      std::unique_ptr<IRegex> special_token_regex,
      std::optional<uint64_t> unk_token_id,
      std::optional<uint64_t> bos_token_id,
      std::optional<uint64_t> eos_token_id,
      std::unordered_set<std::string> rstrip_tokens = {},
      std::unordered_set<std::string> lstrip_tokens = {});

  ~WordLevelModel() override = default;

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
  detail::TokenMap token_map_;
  detail::TokenMap special_token_map_;
  std::unique_ptr<IRegex> special_token_regex_;

  std::optional<uint64_t> unk_token_id_;
  std::optional<uint64_t> bos_token_id_;
  std::optional<uint64_t> eos_token_id_;
  std::unordered_set<std::string> rstrip_tokens_;
  std::unordered_set<std::string> lstrip_tokens_;

  bool initialized_ = false;
  int32_t vocab_size_ = 0;
};

} // namespace tokenizers
