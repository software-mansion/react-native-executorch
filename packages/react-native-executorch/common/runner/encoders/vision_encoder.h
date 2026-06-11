// common/runner/encoders/vision_encoder.h
#pragma once

#include "iencoder.h"
#include <cstdint>
#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/evalue.h>
#include <runner/multimodal_input.h>
#include <string>
#include <unordered_map>
#include <vector>

namespace executorch::extension::llm {

class VisionEncoder : public IEncoder {
public:
  explicit VisionEncoder(::executorch::extension::Module &module);

  ::executorch::runtime::Error load() override;
  bool is_loaded() const noexcept override;
  ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const MultimodalInput &input) override;
  int32_t encoderTokenCount() const override;

private:
  struct ImageShape {
    int32_t channels, height, width;
    bool with_batch;
  };

  // The method's output EValue aliases the runtime's reusable output buffer,
  // which the NEXT vision_encoder.execute() overwrites — caching it directly
  // silently turns earlier images into the most recently encoded one. Cache
  // an owned byte snapshot instead and hand out a tensor over those bytes.
  struct CachedEmbedding {
    std::vector<uint8_t> bytes;
    std::vector<::executorch::aten::SizesType> sizes;
    ::executorch::aten::ScalarType dtype;
    ::executorch::extension::TensorPtr tensor;
  };

  ::executorch::runtime::Result<ImageShape> getInputShape() const;
  std::vector<float> preprocessImage(const std::string &path,
                                     const ImageShape &targetShape) const;

  ::executorch::extension::Module *module_;
  std::unordered_map<std::string, CachedEmbedding> embedding_cache_;
};

} // namespace executorch::extension::llm
