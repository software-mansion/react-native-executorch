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
#include <string>
#include <vector>

#include <nlohmann/json.hpp>
#include <pytorch/tokenizers/map_utils.h>
#include <pytorch/tokenizers/result.h>
#include <pytorch/tokenizers/string_integer_map.h>

namespace tokenizers {

// -- Base ---------------------------------------------------------------------

/**
 * Abstract base class for tokenization models.
 *
 * A Model corresponds to the core logic that converts a piece of text (usually
 * resulting from the pre-tokenization step) into a sequence of token IDs, and
 * vice-versa.
 *
 * It encapsulates the vocabulary and the algorithm (e.g., BPE, WordPiece,
 * Unigram).
 */
class Model {
public:
  using Ptr = std::shared_ptr<Model>;

  virtual ~Model() = default;

  /**
   * Tokenizes a string piece into a sequence of token IDs.
   *
   * @param piece The input string to tokenize.
   * @return A Result containing the vector of token IDs.
   */
  virtual Result<std::vector<uint64_t>>
  tokenize(const std::string &piece) const = 0;

  /**
   * Converts a token ID to its string representation.
   *
   * @param token The token ID.
   * @return A Result containing the string representation of the token.
   */
  virtual Result<std::string> id_to_piece(uint64_t token) const = 0;

  /**
   * Converts a string representation to its token ID.
   *
   * @param piece The string representation of the token.
   * @return A Result containing the token ID.
   */
  virtual Result<uint64_t> piece_to_id(const std::string &piece) const = 0;

  /**
   * Returns the size of the vocabulary.
   *
   * @return The number of tokens in the vocabulary.
   */
  virtual int32_t vocab_size() const = 0;

  /**
   * Returns whether the token is a special token.
   *
   * @param token The token ID.
   * @return True if the token is a special token, false otherwise.
   */
  virtual bool is_special_token(uint64_t token) const = 0;

  /**
   * Returns whether the model is loaded.
   *
   * @return True if the model is loaded, false otherwise.
   */
  virtual bool is_loaded() const = 0;

  /**
   * Helper to split input text into a special token and the preceding regular
   * text.
   *
   * @param input The input string.
   * @param offset The starting offset.
   * @return A pair of (matched special token string, preceding regular text).
   */
  virtual std::pair<std::optional<std::string>, std::string>
  split_with_allowed_special_token(const std::string &input,
                                   size_t offset) const = 0;

  virtual uint64_t bos_token_id() const = 0;
  virtual uint64_t eos_token_id() const = 0;
};

// -- Factory ------------------------------------------------------------------

// Helper macro to standardize addition of config member fields
#define MODEL_CONFIG_MEMBER(type, name)                                        \
  std::optional<type> name;                                                    \
  ModelConfig &set_##name(type arg) {                                          \
    this->name = std::move(arg);                                               \
    return *this;                                                              \
  }

/**
 * Factory and config class for creating a new Model
 */
class ModelConfig {
public:
  std::string type;

  // Data for BPEModel
  using TokenPairs = std::vector<std::pair<std::string, uint64_t>>;
  MODEL_CONFIG_MEMBER(TokenPairs, token_pairs)
  MODEL_CONFIG_MEMBER(TokenPairs, special_token_pairs)

  MODEL_CONFIG_MEMBER(std::vector<std::string>, merges)
  MODEL_CONFIG_MEMBER(bool, byte_fallback)
  MODEL_CONFIG_MEMBER(std::string, unk_token)
  MODEL_CONFIG_MEMBER(std::string, bos_token)
  MODEL_CONFIG_MEMBER(std::string, eos_token)
  MODEL_CONFIG_MEMBER(std::string, continuing_subword_prefix)
  MODEL_CONFIG_MEMBER(size_t, max_input_chars_per_word)

  // Paths for extra config files (HuggingFace specific)
  MODEL_CONFIG_MEMBER(std::string, model_config_path)
  MODEL_CONFIG_MEMBER(std::string, special_tokens_map_path)

  ModelConfig() = default;

  /**
   * Populate from a json config file (the root tokenizer.json)
   */
  ModelConfig &parse_json(const nlohmann::json &json_config);

  /**
   * Construct the model instance from the member data
   */
  Model::Ptr create() const;
};

} // namespace tokenizers