/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

#include <algorithm>
#include <memory>
#include <string>
#include <type_traits>
#include <unordered_map>
#include <vector>

#include <pytorch/tokenizers/error.h>
#include <pytorch/tokenizers/regex.h>
#include <pytorch/tokenizers/result.h>
#include <pytorch/tokenizers/string_integer_map.h>

#include "re2/re2.h"

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

using TokenMap = StringIntegerMap<>;

template <typename TToken, typename TRank>
static Result<TokenMap>
build_token_map(std::vector<std::pair<TToken, TRank>> container) {
  static_assert(std::is_same_v<TToken, std::string> ||
                    std::is_same_v<TToken, std::string_view>,
                "TToken must be std::string or std::string_view");
  static_assert(std::is_integral_v<TRank> && std::is_unsigned_v<TRank>,
                "TRank must be an unsigned integer");

  std::sort(container.begin(), container.end(),
            [](const auto &a, const auto &b) { return a.first < b.first; });

  auto duplicate_begin = std::unique(
      container.begin(), container.end(),
      [](const auto &a, const auto &b) { return a.first == b.first; });

  TK_CHECK_OR_RETURN_ERROR(
      duplicate_begin == container.end(), ParseFailure,
      "duplicate token: %s rank: %llu", duplicate_begin->first.c_str(),
      static_cast<unsigned long long>(duplicate_begin->second));

  std::sort(container.begin(), container.end(),
            [](const auto &a, const auto &b) { return a.second < b.second; });

  duplicate_begin = std::unique(
      container.begin(), container.end(),
      [](const auto &a, const auto &b) { return a.second == b.second; });

  TK_CHECK_OR_RETURN_ERROR(
      duplicate_begin == container.end(), ParseFailure,
      "duplicate rank: %llu"
      " token: %s",
      static_cast<unsigned long long>(duplicate_begin->second),
      duplicate_begin->first.c_str());

  return TokenMap(container);
};

template <typename TContainer, typename TTokenAccessor, typename TRankAccessor>
static Result<TokenMap> build_token_map(const TContainer &container,
                                        TTokenAccessor token_accessor,
                                        TRankAccessor rank_accessor) {
  using TokenType = std::invoke_result_t<TTokenAccessor, const TContainer &>;
  using RankType = std::invoke_result_t<TRankAccessor, const TContainer &>;

  static_assert(std::is_same_v<TokenType, std::string> ||
                    std::is_same_v<TokenType, std::string_view>,
                "TokenType must be std::string or std::string_view");
  static_assert(std::is_integral_v<RankType> && std::is_unsigned_v<RankType>,
                "RankType must be an unsigned integer");

  std::vector<std::pair<TokenType, RankType>> pairs;
  pairs.reserve(container.size());
  for (const auto &value : container) {
    pairs.emplace_back(token_accessor(value), rank_accessor(value));
  }

  return build_token_map(std::move(pairs));
}

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

inline Result<std::unique_ptr<IRegex>>
build_special_token_regex(const TokenMap &special_token_map) {
  std::string special_pattern;
  const std::size_t count = special_token_map.size();

  for (std::size_t i = 0; i < count; ++i) {
    const auto &[token, _] = special_token_map.getElement(i);
    if (!special_pattern.empty()) {
      special_pattern += "|";
    }
    special_pattern += re2::RE2::QuoteMeta(std::string(token));
  }

  if (special_pattern.empty()) {
    return static_cast<std::unique_ptr<IRegex>>(nullptr);
  }
  // Wrap pattern in parentheses for proper grouping
  return create_regex("(" + special_pattern + ")");
}

} // namespace detail
} // namespace tokenizers
