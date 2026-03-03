// common/runner/encoders/vision_encoder.h
#pragma once

#include "iencoder.h"
#include <executorch/extension/module/module.h>
#include <runner/multimodal_input.h>

namespace executorch::extension::llm {

class VisionEncoder : public IEncoder {
public:
  explicit VisionEncoder(::executorch::extension::Module *module);

  ::executorch::runtime::Error load() override;
  bool is_loaded() const override;
  ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const MultimodalInput &input) override;

private:
  ::executorch::extension::Module *module_;
};

} // namespace executorch::extension::llm
