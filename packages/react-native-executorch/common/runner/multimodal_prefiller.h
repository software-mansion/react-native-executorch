/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_prefiller.h

#pragma once

#include "multimodal_decoder_runner.h"
#include "multimodal_input.h"
#include <executorch/extension/module/module.h>
#include <pytorch/tokenizers/hf_tokenizer.h>
#include <runner/encoders/iencoder.h>

namespace executorch::extension::llm {

namespace Types {
struct ImageSlot {
  const MultimodalInput *input; // non-owning, valid for duration of call
  int64_t slot_start;
  int64_t num_visual;
};

struct AudioSlot {
  std::vector<uint8_t> bytes;
  ::executorch::aten::ScalarType dtype;
  int64_t slot_start;
  int64_t num_audio;
  int64_t audio_hidden;
};

struct PLEEmbeddings {
  std::vector<uint8_t> ple_tok_buf;
  aten::SizesType num_layers = 0;
  aten::SizesType ple_dim = 0;
  size_t ple_elem_size = 0;
  ::executorch::aten::ScalarType ple_tok_dtype =
      ::executorch::aten::ScalarType::Half;
};
} // namespace Types

class MultimodalPrefiller {
public:
  explicit MultimodalPrefiller(
      Module &module, MultimodalDecoderRunner &decoder_runner,
      tokenizers::HFTokenizer &tokenizer,
      std::unordered_map<std::string, int64_t> metadata,
      IEncoder *image_encoder = nullptr, IEncoder *audio_encoder = nullptr);

  // Prefill one input segment. Updates start_pos in-place.
  // Returns the first predicted token after this segment.
  ::executorch::runtime::Result<uint64_t>
  prefill(const std::vector<MultimodalInput> &inputs, int64_t &start_pos);

  auto processMultimodalInput(const MultimodalInput &input,
                              std::vector<int64_t> &ids,
                              std::vector<Types::ImageSlot> &image_slots,
                              std::vector<Types::AudioSlot> &audio_slots);
  ::executorch::runtime::Error load();
  bool is_method_loaded();
  std::optional<int64_t> get_max_seq_len() const;
  std::optional<int64_t> get_max_context_len() const;
  bool get_enable_dynamic_shape() const;

private:
  auto encodeImages(const Types::ImageSlot &slot, const auto hidden,
                    std::vector<uint8_t> &embeds_buf,
                    const size_t embeds_elem_size,
                    const ::executorch::aten::ScalarType &embeds_dtype);
  auto encodeAudio(const Types::AudioSlot &slot, const auto hidden,
                   std::vector<uint8_t> &embeds_buf,
                   const size_t embeds_elem_size,
                   const ::executorch::aten::ScalarType &embeds_dtype);
  auto prefillChunk(std::vector<::executorch::runtime::EValue> &last_outs,
                    std::vector<uint8_t> &embeds_buf, auto chunk_start,
                    auto chunk_len, auto hidden, auto embeds_elem_size,
                    auto embeds_dtype, Types::PLEEmbeddings &ple_embeddings,
                    std::vector<int64_t> &cache_positions);
  auto initializePLE(auto &embed_outputs, auto total_len,
                     Types::PLEEmbeddings &ple_embeddings);

  Module *module_;
  MultimodalDecoderRunner *decoder_runner_;
  tokenizers::HFTokenizer *tokenizer_;
  std::unordered_map<std::string, int64_t> metadata_;
  IEncoder *image_encoder_;
  IEncoder *audio_encoder_;
};

} // namespace executorch::extension::llm
