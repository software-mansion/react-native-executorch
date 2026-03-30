/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

// Base class for all BPE tokenizer implementations
#pragma once

// Standard
#include <memory>
#include <optional>
#include <string>
#include <type_traits>
#include <unordered_map>
#include <vector>

// Local
#include <pytorch/tokenizers/error.h>
#include <pytorch/tokenizers/map_utils.h>
#include <pytorch/tokenizers/regex.h>
#include <pytorch/tokenizers/result.h>
#include <pytorch/tokenizers/string_integer_map.h>
#include <pytorch/tokenizers/tokenizer.h>

#include "re2/re2.h"

namespace tokenizers {
namespace detail {

class BPETokenizerBase : public Tokenizer {
public:
  Result<std::vector<uint64_t>> encode(const std::string &input, int8_t bos,
                                       int8_t eos) const override;

  Result<std::string> id_to_piece(uint64_t token) const override;
  Result<uint64_t> piece_to_id(const std::string &text) const override;

  Result<std::string> decode(uint64_t prev_token, uint64_t token,
                             bool skip_special_tokens = false) const override;

protected:
  explicit BPETokenizerBase() {}
  virtual ~BPETokenizerBase() override {}

  std::pair<std::optional<std::string>, std::string>
  split_with_allowed_special_token_(const std::string &input,
                                    const TokenMap &allowed_special) const;

  std::pair<std::optional<std::string>, std::string>
  split_with_allowed_special_token_(const std::string &input, size_t offset,
                                    const TokenMap &allowed_special) const;

  Result<std::pair<std::vector<uint64_t>, uint64_t>>
  encode_with_special_token_(const std::string &text,
                             const TokenMap &allowed_special) const;

  virtual Result<std::vector<uint64_t>>
  byte_pair_encode_(const std::string &piece, const TokenMap &encoder) const;

  // Virtual method for BPE merging - can be overridden by derived classes
  // The passed in `ranks` param for the base impl is just a regular token map
  // and that the actual ranks are derived implicitly from the regular token
  // map. This is the same implementation as Tiktoken.
  virtual std::vector<uint64_t>
  _byte_pair_merge(const std::string &piece, const TokenMap &ranks,
                   std::function<uint64_t(uint64_t, uint64_t)> func) const;

  // Protected members that can be overloaded by other BPE tokenizers
  std::unique_ptr<IRegex> special_token_regex_;
  std::optional<TokenMap> token_map_;
  std::optional<TokenMap> special_token_map_;

private:
  virtual Error _encode(const std::string &input, std::vector<uint64_t> &ret,
                        uint64_t &last_piece_token_len) const = 0;

  virtual void _decode(const std::string &input, std::string &ret) const = 0;
};

} // namespace detail
} // namespace tokenizers
