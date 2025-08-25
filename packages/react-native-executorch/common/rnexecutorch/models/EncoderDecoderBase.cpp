#include <rnexecutorch/models/EncoderDecoderBase.h>

namespace rnexecutorch::models {

EncoderDecoderBase::EncoderDecoderBase(
    const std::string &encoderPath, const std::string &decoderPath,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker),
      encoder_(std::make_unique<BaseModel>(encoderPath, callInvoker)),
      decoder_(std::make_unique<BaseModel>(decoderPath, callInvoker)) {};

size_t EncoderDecoderBase::getMemoryLowerBound() const noexcept {
  return encoder_->getMemoryLowerBound() + decoder_->getMemoryLowerBound();
}

void EncoderDecoderBase::unload() noexcept {
  encoder_.reset(nullptr);
  decoder_.reset(nullptr);
}

} // namespace rnexecutorch::models
