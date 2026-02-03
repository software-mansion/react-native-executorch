/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

#include <map>
#include <memory>
#include <string>
#include <variant>
#include <vector>

#include <nlohmann/json.hpp>

namespace tokenizers {

// -- Base ---------------------------------------------------------------------

/**
 * Base class for all post-processors
 */
class PostProcessor {
public:
  /** Shared pointer type */
  using Ptr = std::shared_ptr<PostProcessor>;

  virtual ~PostProcessor() = default;

  /**
   * Returns the number of tokens added by this PostProcessor
   */
  virtual size_t added_tokens(bool is_pair) const = 0;

  /**
   * Process the token IDs (single sequence).
   */
  virtual std::vector<uint64_t>
  process(const std::vector<uint64_t> &tokens,
          bool add_special_tokens = true) const = 0;

  /**
   * Process the token IDs (pair sequence).
   */
  virtual std::vector<uint64_t>
  process(const std::vector<uint64_t> &tokens_a,
          const std::vector<uint64_t> &tokens_b,
          bool add_special_tokens = true) const = 0;
};

// -- Factory/Common Types -----------------------------------------------------

enum class SequenceId { A, B };

struct Piece {
  bool is_special_token;
  std::string id; // For SpecialToken (e.g. "[CLS]"). For Sequence (e.g. "A").
  uint32_t type_id;

  static Piece Sequence(SequenceId id, uint32_t type_id) {
    return {false, id == SequenceId::A ? "A" : "B", type_id};
  }
  static Piece SpecialToken(std::string id, uint32_t type_id) {
    return {true, std::move(id), type_id};
  }
};

using Template = std::vector<Piece>;

struct SpecialToken {
  std::string id;
  std::vector<uint32_t> ids;
  std::vector<std::string> tokens;
};

// -- TemplateProcessing -------------------------------------------------------

class TemplateProcessing : public PostProcessor {
public:
  TemplateProcessing(Template single, Template pair,
                     std::map<std::string, SpecialToken> special_tokens);

  size_t added_tokens(bool is_pair) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens,
                                bool add_special_tokens = true) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens_a,
                                const std::vector<uint64_t> &tokens_b,
                                bool add_special_tokens = true) const override;

private:
  Template single_;
  Template pair_;
  std::map<std::string, SpecialToken> special_tokens_;
  size_t added_single_;
  size_t added_pair_;

  std::vector<uint64_t> apply_template(const Template &tmpl,
                                       const std::vector<uint64_t> &tokens_a,
                                       const std::vector<uint64_t> *tokens_b,
                                       bool add_special_tokens) const;
};

// -- BertProcessing -----------------------------------------------------------

class BertProcessing : public PostProcessor {
public:
  BertProcessing();

  size_t added_tokens(bool is_pair) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens,
                                bool add_special_tokens = true) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens_a,
                                const std::vector<uint64_t> &tokens_b,
                                bool add_special_tokens = true) const override;
};

// -- RobertaProcessing --------------------------------------------------------

class RobertaProcessing : public PostProcessor {
public:
  RobertaProcessing();

  size_t added_tokens(bool is_pair) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens,
                                bool add_special_tokens = true) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens_a,
                                const std::vector<uint64_t> &tokens_b,
                                bool add_special_tokens = true) const override;
};

// -- Sequence -----------------------------------------------------------------

class Sequence : public PostProcessor {
public:
  explicit Sequence(std::vector<PostProcessor::Ptr> processors);

  size_t added_tokens(bool is_pair) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens,
                                bool add_special_tokens = true) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens_a,
                                const std::vector<uint64_t> &tokens_b,
                                bool add_special_tokens = true) const override;

private:
  std::vector<PostProcessor::Ptr> processors_;
};

// -- Config -------------------------------------------------------------------

class PostProcessorConfig {
public:
  std::string type;

  // TemplateProcessing
  Template single;
  Template pair;
  std::map<std::string, SpecialToken> special_tokens;

  // Bert / Roberta (unused params in no-op, but kept for parsing logic)
  std::pair<std::string, uint32_t> sep;
  std::pair<std::string, uint32_t> cls;
  bool trim_offsets = true;
  bool add_prefix_space = true;

  // Sequence
  std::vector<PostProcessorConfig> processors;

  explicit PostProcessorConfig(std::string type = "");

  PostProcessor::Ptr create() const;

  PostProcessorConfig &parse_json(const nlohmann::json &json_config);
};

} // namespace tokenizers