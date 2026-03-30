// common/runner/encoders/vision_encoder.h
#pragma once

#include "iencoder.h"
#include <executorch/extension/module/module.h>
#include <executorch/runtime/core/evalue.h>
#include <runner/multimodal_input.h>
#include <string>
#include <unordered_map>

namespace executorch::extension::llm {

class VisionEncoder : public IEncoder {
public:
  explicit VisionEncoder(::executorch::extension::Module &module);

  ::executorch::runtime::Error load() override;
  bool is_loaded() const noexcept override;
  ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const MultimodalInput &input) override;
  ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const cv::Mat &image) override;
  int32_t encoderTokenCount() const override;

private:
  struct ImageShape {
    int32_t channels, height, width;
    bool with_batch;
  };

  ::executorch::runtime::Result<ImageShape> getInputShape() const;
  std::vector<float> preprocessImage(const std::string &path,
                                     const ImageShape &targetShape) const;
  std::vector<float> preprocessMat(const cv::Mat &rgb,
                                   const ImageShape &targetShape) const;

  ::executorch::extension::Module *module_;
  std::unordered_map<std::string, ::executorch::runtime::EValue>
      embedding_cache_;
};

} // namespace executorch::extension::llm
