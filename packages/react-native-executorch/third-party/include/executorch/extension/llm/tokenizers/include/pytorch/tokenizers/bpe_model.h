/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <vector>

#include <pytorch/tokenizers/map_utils.h>
#include <pytorch/tokenizers/model.h>
#include <pytorch/tokenizers/regex.h>
#include <pytorch/tokenizers/result.h>
#include <pytorch/tokenizers/string_integer_map.h>

namespace tokenizers {

class BPEModel : public Model {
public:
  explicit BPEModel(detail::TokenMap token_map,
                    detail::TokenMap special_token_map,
                    std::optional<detail::TokenMap> merge_ranks,
                    std::unique_ptr<IRegex> special_token_regex,
                    bool byte_fallback, std::optional<uint64_t> unk_token_id,
                    std::optional<uint64_t> bos_token_id,
                    std::optional<uint64_t> eos_token_id);

  ~BPEModel() override = default;

  Result<std::vector<uint64_t>>
  tokenize(const std::string &piece) const override;

  Result<std::string> id_to_piece(uint64_t token) const override;
  Result<uint64_t> piece_to_id(const std::string &token) const override;

  int32_t vocab_size() const override { return vocab_size_; }

  bool is_special_token(uint64_t token) const override;

  bool is_loaded() const override { return initialized_; }

  std::pair<std::optional<std::string>, std::string>
  split_with_allowed_special_token(const std::string &input,
                                   size_t offset) const override;

  uint64_t bos_token_id() const override { return bos_token_id_.value_or(0); }

  uint64_t eos_token_id() const override { return eos_token_id_.value_or(0); }

private:
  Result<std::pair<std::vector<uint64_t>, uint64_t>>
  encode_with_special_token(const std::string &text) const;

  Result<std::vector<uint64_t>>
  byte_pair_encode(const std::string &piece) const;

  std::vector<uint64_t>
  byte_pair_merge(const std::string &piece, const detail::TokenMap &ranks,
                  std::function<uint64_t(uint64_t, uint64_t)> func) const;

  // Real state
  detail::TokenMap token_map_;
  detail::TokenMap special_token_map_;
  std::optional<detail::TokenMap> merge_ranks_;
  std::unique_ptr<IRegex> special_token_regex_;

  bool byte_fallback_ = false;
  std::optional<uint64_t> unk_token_id_;
  std::optional<uint64_t> bos_token_id_;
  std::optional<uint64_t> eos_token_id_;

  bool initialized_ = false;
  int32_t vocab_size_ = 0;
};

} // namespace tokenizers
