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
  // Encodes one input segment, returns embeddings EValue
  virtual ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const MultimodalInput &input) = 0;
};

} // namespace executorch::extension::llm
