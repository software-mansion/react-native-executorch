/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

// Standard
#include <memory>
#include <optional>
#include <string>
#include <vector>

// Third Party
#include <nlohmann/json.hpp>

namespace tokenizers {

// -- Truncation ---------------------------------------------------------------

enum class TruncationStrategy {
  LongestFirst,
  OnlyFirst,
  OnlySecond,
};

enum class TruncationDirection {
  Left,
  Right,
};

struct TruncationParams {
  TruncationDirection direction = TruncationDirection::Right;
  size_t max_length = 512;
  TruncationStrategy strategy = TruncationStrategy::LongestFirst;
  size_t stride = 0;
};

class Truncation {
public:
  /** Shared pointer type */
  typedef std::shared_ptr<Truncation> Ptr;

  /**
   * @param params: The truncation parameters
   */
  explicit Truncation(const TruncationParams &params);

  /**
   * Truncate the tokens according to the configuration.
   *
   * @param tokens The tokens to truncate.
   * @param num_tokens_to_add The number of special tokens that will be added
   * later. These are subtracted from max_length during truncation calculation.
   */
  std::vector<uint64_t> truncate(std::vector<uint64_t> tokens,
                                 size_t num_tokens_to_add = 0) const;

  /**
   * Truncate a pair of sequences according to the configuration.
   */
  std::pair<std::vector<uint64_t>, std::vector<uint64_t>>
  truncate_pair(std::vector<uint64_t> a, std::vector<uint64_t> b,
                size_t num_tokens_to_add = 0) const;

private:
  TruncationParams params_;
};

// -- Factory ------------------------------------------------------------------

class TruncationConfig {
public:
  /**
   * Construct the truncation instance from the member data
   */
  Truncation::Ptr create() const;

  /**
   * Populate from a json config file
   */
  TruncationConfig &parse_json(const nlohmann::json &json_config);

  // Configuration members
  TruncationParams params;
};

} // namespace tokenizers