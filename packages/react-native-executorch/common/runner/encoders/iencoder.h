// common/runner/encoders/iencoder.h
#pragma once

#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/evalue.h>
#include <executorch/runtime/core/result.h>
#include <opencv2/core/mat.hpp>
#include <runner/multimodal_input.h>

namespace executorch::extension::llm {

class IEncoder {
public:
  virtual ~IEncoder() = default;
  virtual ::executorch::runtime::Error load() = 0;
  virtual bool is_loaded() const noexcept = 0;

  virtual ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const MultimodalInput &input) = 0;

  virtual ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const cv::Mat & /*image*/) {
    return ::executorch::runtime::Error::NotSupported;
  }

  // Returns the number of tokens produced per encoded input (e.g. visual
  // tokens per image). Returns 0 if not loaded or unknown.
  virtual int32_t encoderTokenCount() const { return 0; }
};

} // namespace executorch::extension::llm
