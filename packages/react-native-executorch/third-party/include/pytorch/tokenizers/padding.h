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

// -- Padding ------------------------------------------------------------------

enum class PaddingDirection {
  Left,
  Right,
};

enum class PaddingStrategy {
  BatchLongest,
  Fixed,
};

struct PaddingParams {
  PaddingStrategy strategy = PaddingStrategy::BatchLongest;
  PaddingDirection direction = PaddingDirection::Right;
  std::optional<size_t> fixed_size;
  std::optional<size_t> pad_to_multiple_of;
  uint32_t pad_id = 0;
  uint32_t pad_type_id = 0;
  std::string pad_token = "[PAD]";
};

class Padding {
public:
  /** Shared pointer type */
  typedef std::shared_ptr<Padding> Ptr;

  /**
   * @param params: The padding parameters
   */
  explicit Padding(const PaddingParams &params);

  /**
   * Pad the tokens according to the configuration
   */
  std::vector<uint64_t> pad(std::vector<uint64_t> tokens) const;

  /**
   * Generate attention mask for the padded tokens.
   * 1 for real tokens, 0 for padded tokens.
   */
  std::vector<uint32_t> generate_mask(const std::vector<uint64_t> &tokens,
                                      size_t padded_size) const;

private:
  PaddingParams params_;
};

// -- Factory ------------------------------------------------------------------

// Helper macro to standardize addition of config member fields
#define PADDING_CONFIG_MEMBER(type, name)                                      \
  PaddingConfig &set_##name(type arg) {                                        \
    this->params.name = std::move(arg);                                        \
    return *this;                                                              \
  }

class PaddingConfig {
public:
  explicit PaddingConfig(std::string strategy = "");

  /**
   * Construct the padding instance from the member data
   */
  Padding::Ptr create() const;

  /**
   * Populate from a json config file
   */
  PaddingConfig &parse_json(const nlohmann::json &json_config);

  // Configuration members
  PaddingParams params;

  PADDING_CONFIG_MEMBER(PaddingStrategy, strategy)
  PADDING_CONFIG_MEMBER(PaddingDirection, direction)

  PaddingConfig &set_fixed_size(std::optional<size_t> arg) {
    this->params.fixed_size = std::move(arg);
    this->params.strategy = PaddingStrategy::Fixed;
    return *this;
  }

  PADDING_CONFIG_MEMBER(std::optional<size_t>, pad_to_multiple_of)
  PADDING_CONFIG_MEMBER(uint32_t, pad_id)
  PADDING_CONFIG_MEMBER(uint32_t, pad_type_id)
  PADDING_CONFIG_MEMBER(std::string, pad_token)
};

} // namespace tokenizers
