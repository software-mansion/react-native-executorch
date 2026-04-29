/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @lint-ignore-every LICENSELINT
 */

#pragma once

#include <memory>
#include <optional>
#include <string>
#include <vector>

// Third Party
#include <nlohmann/json.hpp>

// Local
#include <pytorch/tokenizers/bpe_tokenizer_base.h>
#include <pytorch/tokenizers/error.h>
#include <pytorch/tokenizers/regex.h>
#include <pytorch/tokenizers/result.h>

namespace tokenizers {

class Tekken : public detail::BPETokenizerBase {
 public:
  struct TekkenConfig {
    std::string pattern;
    size_t num_vocab_tokens;
    size_t default_vocab_size;
    size_t default_num_special_tokens;
    std::string version;
  };

  struct TokenInfo {
    uint64_t rank;
    std::string token_bytes; // Base64 encoded
    std::optional<std::string> token_str;
  };

  struct SpecialTokenInfo {
    uint64_t rank;
    std::string token_str;
    bool is_control;
  };

  explicit Tekken();
  ~Tekken() override = default;

  // Load from tekken.json file
  Error load(const std::string& tokenizer_path) override;

  // Support loading with explicit special tokens
  Error load_with_special_tokens(
      const std::string& tokenizer_path,
      const std::vector<SpecialTokenInfo>& special_tokens);

  // Get the version string
  const std::string& get_version() const {
    return _version;
  }

 protected:
  // Virtual methods from BPETokenizerBase
  Error _encode(
      const std::string& input,
      std::vector<uint64_t>& ret,
      uint64_t& last_piece_token_len) const override;

  void _decode(const std::string& input, std::string& ret) const override;

 private:
  // Parse the JSON configuration
  Result<TekkenConfig> _parse_config(const nlohmann::json& j) const;

  // Build token map from JSON vocab
  Result<detail::TokenMap> _load_vocab_from_json(
      const nlohmann::json& vocab_json,
      size_t max_vocab) const;

  // Initialize special tokens (fills up to num_special_tokens slots)
  std::vector<SpecialTokenInfo> _initialize_special_tokens(
      const std::vector<SpecialTokenInfo>& defined_tokens,
      size_t num_special_tokens) const;

  // Default Tekken pattern
  static std::string _get_default_tekken_pattern();

  // Default special tokens for Mistral models
  static std::vector<SpecialTokenInfo> _get_default_special_tokens();

  size_t _num_special_tokens = 1000; // Tekken reserves 1000 slots
  std::string _version;
  std::string _pattern;
  std::unique_ptr<IRegex> _regex;
};

} // namespace tokenizers
