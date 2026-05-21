/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Given inputs, run a text decoder in LLM and return the output.

#pragma once

#include "constants.h"
#include "io_manager.h"
#include "sampler.h"

namespace executorch {
namespace extension {
namespace llm {

// Forward declaration to avoid the include chain
// irunner.h -> stats.h -> util.h -> text_prefiller.h -> text_decoder_runner.h
// which would re-enter this header before TextDecoderRunner is defined.
struct GenerationConfig;

class TextDecoderRunner {
public:
  explicit TextDecoderRunner(Module &module, IOManager *io_manager,
                             const GenerationConfig &config);

  virtual ~TextDecoderRunner() = default;

  /**
   * Run LLM text decoder with inputs to generate next token.
   * @param input The input to the LLM Module.
   * @param start_pos The starting position in KV cache of the input in the LLM
   * Module.
   * @return The output of the LLM Module. This will be a tensor of logits.
   */
  virtual ::executorch::runtime::Result<executorch::aten::Tensor>
  step(TensorPtr &input, int64_t start_pos);

  /**
   * Load the Module for text decode purpose. Always loads `forward` (used for
   * prefill, may be static-shape e.g. [1,256]). Also loads `forward_decode`
   * if the PTE exposes it (single-token decode path).
   */
  virtual ::executorch::runtime::Error load() {
    auto err = module_->load_method("forward");
    if (err != ::executorch::runtime::Error::Ok) {
      return err;
    }
    if (module_->method_meta("forward_decode").ok()) {
      auto derr = module_->load_method("forward_decode");
      if (derr != ::executorch::runtime::Error::Ok) {
        return derr;
      }
    }
    return ::executorch::runtime::Error::Ok;
  }

  /**
   * Check if the required methods in the Module is loaded.
   * @return True if the Module is loaded, false otherwise.
   */
  virtual bool is_method_loaded() {
    if (!module_->is_method_loaded("forward")) {
      return false;
    }
    if (module_->method_meta("forward_decode").ok() &&
        !module_->is_method_loaded("forward_decode")) {
      return false;
    }
    return true;
  }

  /**
   * If `forward` declares a static prompt length (input 0 size [1, N]), return
   * N. Returns 0 when the prefill method is dynamic-shape or the size cannot
   * be determined. Used by TextPrefiller to pad prompt chunks to the exact
   * static length the PTE expects.
   *
   * Detection order:
   *  1) If the PTE exposes the `enable_dynamic_shape` constant_method and it
   *     reads as truthy (bool true OR int!=0), the PTE is dynamic — return 0
   *     so the prefiller sends the actual prompt length, no padding. This
   *     covers iter170+ PTEs whose `forward` input TensorSpec stores the
   *     dynamic upper bound (e.g. 128) that the meta-based heuristic below
   *     would mis-detect as static.
   *  2) Otherwise (method missing or read failed), fall back to the legacy
   *     TensorSpec-based heuristic: assume the last dim of input 0 is the
   *     fixed prompt length when > 1. Preserves behavior for older PTEs.
   */
  int64_t prefill_static_len() {
    // Step 1: query constant_methods["enable_dynamic_shape"] when present.
    // Use module_->get() — this is the canonical pattern in base_llm_runner.cpp
    // for reading metadata methods. The value is serialized as a Scalar (bool
    // or int); toScalar().to<int64_t>() yields 1 for True, 0 for False.
    auto dyn_res = module_->get(kEnableDynamicShape);
    if (dyn_res.ok()) {
      const auto& evalue = dyn_res.get();
      if (evalue.isScalar()) {
        if (evalue.toScalar().to<int64_t>() != 0) {
          return 0; // PTE declares itself dynamic — no padding needed.
        }
        // Explicitly False — fall through to meta heuristic (static PTE).
      }
    }
    // Step 2: legacy fallback — derive static length from input 0's TensorSpec.
    auto meta_res = module_->method_meta("forward");
    if (!meta_res.ok()) {
      return 0;
    }
    auto meta = std::move(*meta_res);
    auto in0 = meta.input_tensor_meta(0);
    if (!in0.ok()) {
      return 0;
    }
    auto sizes = in0->sizes();
    // Expect tokens tensor of rank >=2 with batch dim = 1 and a fixed seq dim.
    if (sizes.size() < 2) {
      return 0;
    }
    int64_t seq = sizes[sizes.size() - 1];
    return seq > 1 ? seq : 0;
  }

  inline void stop() { should_stop_ = true; }

  /**
   * Sample the next token from the logits tensor using the sampling
   * parameters in `config_`. `recent_tokens` is the prompt-plus-generated
   * window used by the repetition penalty. Defined out-of-line in the cpp
   * so this header doesn't need a complete `GenerationConfig` type.
   */
  int32_t logits_to_token(const executorch::aten::Tensor &logits_tensor,
                          const std::vector<uint64_t> &recent_tokens = {});

protected:
  // Non-owning. The runner (BaseLLMRunner) owns the Module and outlives this.
  Module *module_;
  IOManager *io_manager_;
  bool should_stop_{false};
  const GenerationConfig &config_;
};

} // namespace llm
} // namespace extension
} // namespace executorch

namespace torch {
namespace executor {
// TODO(T197294990): Remove these deprecated aliases once all users have moved
// to the new `::executorch` namespaces.
using ::executorch::extension::llm::TextDecoderRunner;
} // namespace executor
} // namespace torch
