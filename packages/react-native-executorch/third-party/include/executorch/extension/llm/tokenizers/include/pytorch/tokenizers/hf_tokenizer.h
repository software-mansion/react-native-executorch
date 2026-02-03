/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Used by many Huggingface models. Adapted from a combination of the original
// rust implementation (https://github.com/huggingface/tokenizers/tree/main)
// and the corresponding support in llama.cpp
// (https://github.com/ggerganov/llama.cpp)
#pragma once

// Standard
#include <string>

// Local
#include "bpe_tokenizer_base.h"
#include "error.h"
#include "normalizer.h"
#include "post_processor.h"
#include "pre_tokenizer.h"
#include "result.h"
#include "token_decoder.h"
#include <nlohmann/json.hpp>

namespace tokenizers {
namespace detail {

// Hash function for std::pair<uint64_t, uint64_t>
struct PairHash {
  std::size_t operator()(const std::pair<uint64_t, uint64_t> &p) const {
    return std::hash<uint64_t>{}(p.first) ^
           (std::hash<uint64_t>{}(p.second) << 1);
  }
};

// Type alias for BPE merge map: (token_id_1, token_id_2) -> (rank,
// merged_token_id)
using MergeMap = std::unordered_map<std::pair<uint64_t, uint64_t>,
                                    std::pair<uint64_t, uint64_t>, PairHash>;

// Utility function to build merge ranks map from merge rules
template <typename TMergeMap>
inline Result<TokenMap> build_merge_ranks_map(const TMergeMap &merge_map,
                                              const TokenMap &token_map) {
  // Static assertions to verify TMergeMap has the expected key and value types
  using KeyType = typename TMergeMap::key_type;
  using ValueType = typename TMergeMap::mapped_type;

  static_assert(std::is_same_v<KeyType, std::pair<uint64_t, uint64_t>>,
                "TMergeMap key type must be std::pair<uint64_t, uint64_t>");

  static_assert(std::is_same_v<ValueType, std::pair<uint64_t, uint64_t>>,
                "TMergeMap value type must be std::pair<uint64_t, uint64_t>");

  // Use a map to handle duplicates - keep the lowest rank (highest priority)
  std::unordered_map<std::string, uint64_t> unique_merge_ranks;

  for (const auto &[pair, rank_and_id] : merge_map) {
    uint64_t first_id = pair.first;
    uint64_t second_id = pair.second;
    uint64_t rank = rank_and_id.first;

    // Get the token strings for the pair
    auto first_token = token_map.tryGetString(first_id);
    auto second_token = token_map.tryGetString(second_id);

    if (first_token && second_token) {
      std::string merged_token =
          std::string(*first_token) + std::string(*second_token);

      // Keep the entry with the lowest rank (highest priority in BPE)
      auto it = unique_merge_ranks.find(merged_token);
      if (it == unique_merge_ranks.end() || rank < it->second) {
        unique_merge_ranks[merged_token] = rank;
      }
    }
  }

  // Convert to vector for buildTokenMap
  std::vector<std::pair<std::string, uint64_t>> merge_rank_pairs;
  merge_rank_pairs.reserve(unique_merge_ranks.size());

  for (const auto &[token, rank] : unique_merge_ranks) {
    merge_rank_pairs.emplace_back(token, rank);
  }

  return build_token_map(std::move(merge_rank_pairs));
}

} // namespace detail

// Simple Word structure to mimic Rust's Word behavior
struct HFWord {
  std::vector<uint64_t> tokens;
  std::vector<size_t> byte_lengths;

  void add(uint64_t token_id, size_t byte_len) {
    tokens.push_back(token_id);
    byte_lengths.push_back(byte_len);
  }

  size_t size() const { return tokens.size(); }

  // Apply all possible merges using the merge ranks
  void merge_all(const detail::TokenMap &merge_ranks,
                 const detail::TokenMap &token_map) {
    while (tokens.size() > 1) {
      std::optional<std::pair<size_t, uint32_t>> best_merge;

      // Find the best merge (lowest rank) among adjacent token pairs
      for (size_t i = 0; i < tokens.size() - 1; ++i) {
        // Create the merged token string to look up its rank
        auto first_token = token_map.tryGetString(tokens[i]);
        auto second_token = token_map.tryGetString(tokens[i + 1]);

        if (first_token && second_token) {
          std::string merged_token =
              std::string(*first_token) + std::string(*second_token);
          auto rank = merge_ranks.tryGetInteger(merged_token);

          if (rank && (!best_merge || *rank < best_merge->second)) {
            best_merge = std::make_pair(i, static_cast<uint32_t>(*rank));
          }
        }
      }

      if (!best_merge) {
        break; // No more merges possible
      }

      // Apply the best merge
      size_t merge_idx = best_merge->first;

      // Get the merged token ID
      auto first_token = token_map.tryGetString(tokens[merge_idx]);
      auto second_token = token_map.tryGetString(tokens[merge_idx + 1]);

      if (first_token && second_token) {
        std::string merged_token =
            std::string(*first_token) + std::string(*second_token);
        auto merged_id = token_map.tryGetInteger(merged_token);

        if (merged_id) {
          // Replace the two tokens with the merged token
          tokens[merge_idx] = *merged_id;
          byte_lengths[merge_idx] += byte_lengths[merge_idx + 1];

          // Remove the second token
          tokens.erase(tokens.begin() + merge_idx + 1);
          byte_lengths.erase(byte_lengths.begin() + merge_idx + 1);
        } else {
          break; // Merged token not found in vocabulary
        }
      } else {
        break; // Original tokens not found in vocabulary
      }
    }
  }
};

class HFTokenizer : public detail::BPETokenizerBase {
public:
  /*-- Public Interface --*/

  /**
   * Default initialize with no loaded data
   */
  explicit HFTokenizer() {}
  ~HFTokenizer() {}

  /**
   * Load the model data into the
   */
  Error load(const std::string &tokenizer_path) override;

  Result<std::vector<uint64_t>> encode(const std::string &input, int8_t bos = 0,
                                       int8_t eos = 0) const override;

  using BPETokenizerBase::decode;

  Result<std::string> decode(const std::vector<uint64_t> &tokens,
                             bool skip_special_tokens = true) const;

private:
  Error _encode(const std::string &input, std::vector<uint64_t> &ret,
                uint64_t &last_piece_token_len) const override;

  void _decode(const std::string &input, std::string &ret) const override;

  std::vector<std::string>
  _decode(const std::vector<std::string> &pieces) const;

  Result<std::vector<uint64_t>>
  byte_pair_encode_(const std::string &piece,
                    const detail::TokenMap &encoder) const override;

  // Override the virtual _byte_pair_merge method to use explicit merges
  // specified in tokenizer.json. Different from Tiktoken (another user of
  // BPETokenizerBase, but doesn't use explicit merge rules).
  std::vector<uint64_t> _byte_pair_merge(
      const std::string &piece, const detail::TokenMap &ranks,
      std::function<uint64_t(uint64_t, uint64_t)> func) const override;

  Error parse_special_tokens(const nlohmann::json &parsed_json);
  Error parse_tokens(const nlohmann::json &parsed_json);
  Error setup_normalizer(const nlohmann::json &parsed_json);
  Error setup_pretokenizer(const nlohmann::json &parsed_json);
  Error setup_postprocessor(const nlohmann::json &parsed_json);
  Error setup_decoder(const nlohmann::json &parsed_json);
  Error parse_merges(const nlohmann::json &parsed_json);
  Error setup_special_token_ids(const std::string &path,
                                const nlohmann::json &parsed_json,
                                const std::string &model_config_json,
                                const std::string &special_tokens_map_json);

  Normalizer::Ptr _normalizer;
  PreTokenizer::Ptr _pretokenizer;
  PostProcessor::Ptr _postprocessor;
  TokenDecoder::Ptr _decoder;

  std::unique_ptr<detail::MergeMap> merge_map_;
  std::optional<detail::TokenMap>
      merge_ranks_; // Pre-computed merge ranks for BPE
  bool byte_fallback_ = false;
  bool unk_token_is_configured_ = false;
};

} // namespace tokenizers
