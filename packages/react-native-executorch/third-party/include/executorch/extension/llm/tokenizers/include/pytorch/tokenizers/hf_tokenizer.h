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
#include <memory>
#include <string>
#include <vector>

// Local
#include <nlohmann/json.hpp>
#include <pytorch/tokenizers/error.h>
#include <pytorch/tokenizers/model.h>
#include <pytorch/tokenizers/normalizer.h>
#include <pytorch/tokenizers/post_processor.h>
#include <pytorch/tokenizers/pre_tokenizer.h>
#include <pytorch/tokenizers/result.h>
#include <pytorch/tokenizers/token_decoder.h>
#include <pytorch/tokenizers/tokenizer.h>

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
  Error load(const std::string &tokenizer_path) override;

  Result<std::vector<uint64_t>> encode(const std::string &input, int8_t bos = 0,
                                       int8_t eos = 0) const override;

  Result<std::string> id_to_piece(uint64_t token) const override;
  Result<uint64_t> piece_to_id(const std::string &text) const override;

  Result<std::string> decode(uint64_t prev_token, uint64_t token,
                             bool skip_special_tokens = false) const override;

  Result<std::string> decode(const std::vector<uint64_t> &tokens,
                             bool skip_special_tokens = false) const;

private:
  Error setup_normalizer(const nlohmann::json &parsed_json);
  Error setup_pretokenizer(const nlohmann::json &parsed_json);
  Error setup_postprocessor(const nlohmann::json &parsed_json);
  Error setup_decoder(const nlohmann::json &parsed_json);
  Error setup_model(const nlohmann::json &parsed_json,
                    const std::string &model_config_path,
                    const std::string &special_tokens_map_path);

  Normalizer::Ptr _normalizer;
  PreTokenizer::Ptr _pretokenizer;
  PostProcessor::Ptr _postprocessor;
  TokenDecoder::Ptr _decoder;

  Model::Ptr _model;
};

} // namespace tokenizers