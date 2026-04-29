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
#include <memory>
#include <vector>

// Local
#include <nlohmann/json.hpp>
#include <pytorch/tokenizers/error.h>
#include <pytorch/tokenizers/map_utils.h>
#include <pytorch/tokenizers/model.h>
#include <pytorch/tokenizers/regex.h>
#include <pytorch/tokenizers/normalizer.h>
#include <pytorch/tokenizers/padding.h>
#include <pytorch/tokenizers/post_processor.h>
#include <pytorch/tokenizers/pre_tokenizer.h>
#include <pytorch/tokenizers/result.h>
#include <pytorch/tokenizers/token_decoder.h>
#include <pytorch/tokenizers/tokenizer.h>
#include <pytorch/tokenizers/truncation.h>

namespace tokenizers {

class HFTokenizer : public Tokenizer {
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
  Error load(const std::string& tokenizer_path) override;

  Result<std::vector<uint64_t>> encode(
      const std::string& input,
      int8_t bos = 0,
      int8_t eos = 0) const override;

  Result<std::string> id_to_piece(uint64_t token) const override;
  Result<uint64_t> piece_to_id(const std::string& text) const override;

  Result<std::string> decode(
      uint64_t prev_token,
      uint64_t token,
      bool skip_special_tokens = false) const override;

  Result<std::string> decode(
      const std::vector<uint64_t>& tokens,
      bool skip_special_tokens = false) const;

 private:
  Error setup_normalizer(const nlohmann::json& parsed_json);
  Error setup_pretokenizer(const nlohmann::json& parsed_json);
  Error setup_postprocessor(const nlohmann::json& parsed_json);
  Error setup_decoder(const nlohmann::json& parsed_json);
  Error setup_truncation(const nlohmann::json& parsed_json);
  Error setup_padding(const nlohmann::json& parsed_json);
  Error setup_model(
      const nlohmann::json& parsed_json,
      const std::string& model_config_path,
      const std::string& special_tokens_map_path);

  /// Split input around the first added_token match. Returns (matched token,
  /// text before match). Uses _added_token_regex if available, otherwise
  /// falls back to the model's special-only regex.
  std::pair<std::optional<std::string>, std::string>
  split_added_token(const std::string& input, size_t offset) const;

  Normalizer::Ptr normalizer_;
  PreTokenizer::Ptr pretokenizer_;
  PostProcessor::Ptr postprocessor_;
  TokenDecoder::Ptr decoder_;
  Truncation::Ptr truncation_;
  Padding::Ptr padding_;

  Model::Ptr model_;

  // Regex matching ALL added_tokens (both special and non-special).
  // HF matches every added_token as a never-split unit during encoding.
  // This is separate from the model's special_token_regex which only
  // contains special=true tokens (for standalone model.tokenize()).
  std::unique_ptr<IRegex> added_token_regex_;
  std::unique_ptr<detail::TokenMap> added_token_map_;
};

} // namespace tokenizers