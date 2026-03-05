// common/runner/encoders/iencoder.h
#pragma once

#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/evalue.h>
#include <executorch/runtime/core/result.h>
#include <runner/multimodal_input.h>

namespace executorch::extension::llm {

class IEncoder {
public:
  virtual ~IEncoder() = default;
  virtual ::executorch::runtime::Error load() = 0;
  virtual bool is_loaded() const = 0;

  virtual ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const MultimodalInput &input) = 0;

  // Returns the number of tokens produced per encoded input (e.g. visual
  // tokens per image). Returns 0 if not loaded or unknown.
  virtual int32_t encoderTokenCount() const { return 0; }
};

} // namespace executorch::extension::llm
