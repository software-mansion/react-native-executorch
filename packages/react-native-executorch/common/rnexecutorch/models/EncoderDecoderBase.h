#pragma once

#include <ReactCommon/CallInvoker.h>
#include <memory>
#include <optional>
#include <rnexecutorch/models/BaseModel.h>
#include <string>

namespace rnexecutorch {
using namespace facebook;
using executorch::aten::Tensor;
using executorch::runtime::EValue;

class EncoderDecoderBase {
public:
  EncoderDecoderBase(const std::string &encoderPath,
                     const std::string &decoderPath,
                     std::shared_ptr<react::CallInvoker> callInvoker);
  size_t getMemoryLowerBound() {
    return encoder_->getMemoryLowerBound() + decoder_->getMemoryLowerBound();
  }
  void unload();

protected:
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<BaseModel> encoder_;
  std::unique_ptr<BaseModel> decoder_;

  // Store the encoded result - EValue handles tensor lifetime safely
  std::optional<EValue> cachedEncoderOutput_;

private:
  size_t memorySizeLowerBound;
};
} // namespace rnexecutorch
