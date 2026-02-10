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
   *
   * NOTE: Unlike the Rust implementation which  uses a single method
   * taking  Encoding and an Option<Encoding>, we use overloads here
   * to explicitly handle single vs pair sequences while processing raw IDs.
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

// Helper macro to standardize addition of config member fields
#define POST_PROCESSOR_CONFIG_MEMBER(type, name)                               \
  std::optional<type> name;                                                    \
  PostProcessorConfig &set_##name(type arg) {                                  \
    this->name = std::move(arg);                                               \
    return *this;                                                              \
  }

enum class SequenceId { A, B };

struct SpecialToken {
  std::string id;
  std::vector<uint64_t> ids;
  std::vector<std::string> tokens;
};

struct Piece {
  bool is_special_token;
  std::string id; // For SpecialToken (e.g. "[CLS]"). For Sequence (e.g. "A").
  uint64_t type_id;

  static Piece Sequence(SequenceId id, uint64_t type_id) {
    return {false, id == SequenceId::A ? "A" : "B", type_id};
  }
  static Piece SpecialToken(std::string id, uint64_t type_id) {
    return {true, std::move(id), type_id};
  }
};

using Template = std::vector<Piece>;
// -- Config -------------------------------------------------------------------

class PostProcessorConfig {
public:
  using SpecialTokenMap = std::map<std::string, tokenizers::SpecialToken>;
  using StringIdPair = std::pair<std::string, uint64_t>;

  std::string type;

  // TemplateProcessing
  POST_PROCESSOR_CONFIG_MEMBER(Template, single)
  POST_PROCESSOR_CONFIG_MEMBER(Template, pair)
  POST_PROCESSOR_CONFIG_MEMBER(SpecialTokenMap, special_tokens)

  // Bert / Roberta (unused params in no-op, but kept for parsing logic)
  POST_PROCESSOR_CONFIG_MEMBER(StringIdPair, sep)
  POST_PROCESSOR_CONFIG_MEMBER(StringIdPair, cls)
  POST_PROCESSOR_CONFIG_MEMBER(bool, trim_offsets)
  POST_PROCESSOR_CONFIG_MEMBER(bool, add_prefix_space)

  // Sequence
  using Configs = std::vector<PostProcessorConfig>;
  POST_PROCESSOR_CONFIG_MEMBER(Configs, processors)

  explicit PostProcessorConfig(std::string type = "");

  PostProcessor::Ptr create() const;

  PostProcessorConfig &parse_json(const nlohmann::json &json_config);
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

// -- BertProcessing -----------------------------------------------------------
// Used for BERT post-processing (adding special tokens)
class BertProcessing : public PostProcessor {
public:
  BertProcessing(std::pair<std::string, uint64_t> sep,
                 std::pair<std::string, uint64_t> cls);

  size_t added_tokens(bool is_pair) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens,
                                bool add_special_tokens = true) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens_a,
                                const std::vector<uint64_t> &tokens_b,
                                bool add_special_tokens = true) const override;

private:
  std::pair<std::string, uint64_t> sep_;
  std::pair<std::string, uint64_t> cls_;
};

// -- RobertaProcessing --------------------------------------------------------
// Used for RoBERTa post-processing
class RobertaProcessing : public PostProcessor {
public:
  RobertaProcessing(std::pair<std::string, uint64_t> sep,
                    std::pair<std::string, uint64_t> cls, bool trim_offsets,
                    bool add_prefix_space);

  size_t added_tokens(bool is_pair) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens,
                                bool add_special_tokens = true) const override;

  std::vector<uint64_t> process(const std::vector<uint64_t> &tokens_a,
                                const std::vector<uint64_t> &tokens_b,
                                bool add_special_tokens = true) const override;

private:
  std::pair<std::string, uint64_t> sep_;
  std::pair<std::string, uint64_t> cls_;
  bool trim_offsets_;
  bool add_prefix_space_;
};

// -- ByteLevel
// ----------------------------------------------------------------
// TODO: Implement ByteLevelProcessor
// This is a broader issue, as most of the processing is done on offsets.
// Our current implementation doesn't supoort it and would require us to
// introduce a complex Encoding type. Something similiar to the originl hf
// implementaiton:
// https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/tokenizer/encoding.rs
// so we could store the offsets from pretokenization step.
/*
class ByteLevel : public PostProcessor {
 public:
  ByteLevel(bool trim_offsets, bool add_prefix_space);

  size_t added_tokens(bool is_pair) const override;

  std::vector<uint64_t> process(
      const std::vector<uint64_t>& tokens,
      bool add_special_tokens = true) const override;

  std::vector<uint64_t> process(
      const std::vector<uint64_t>& tokens_a,
      const std::vector<uint64_t>& tokens_b,
      bool add_special_tokens = true) const override;

 private:
  bool trim_offsets_;
  bool add_prefix_space_;
};
*/

// -- Sequence
// -----------------------------------------------------------------
} // namespace tokenizers
