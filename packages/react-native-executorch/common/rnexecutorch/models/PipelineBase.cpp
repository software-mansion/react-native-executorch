#include <rnexecutorch/models/PipelineBase.h>

namespace rnexecutorch::models {

PipelineBase::PipelineBase(
  const std::string &tokenizerPath,
  const std::string &schedulerPath,
  const std::string &encoderPath,
  const std::string &transformerPath,
  const std::string &decoderPath,
  std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker),
      encoder_(std::make_unique<BaseModel>(encoderPath, callInvoker)),
      transformer_(std::make_unique<BaseModel>(transformerPath, callInvoker)),
      decoder_(std::make_unique<BaseModel>(decoderPath, callInvoker)) {};

size_t PipelineBase::getMemoryLowerBound() const noexcept {
  return encoder_->getMemoryLowerBound() + transformer_->getMemoryLowerBound() + decoder_->getMemoryLowerBound();
}

void PipelineBase::unload() noexcept {
  encoder_.reset(nullptr);
  transformer_.reset(nullptr);
  decoder_.reset(nullptr);
}

} // namespace rnexecutorch::models
