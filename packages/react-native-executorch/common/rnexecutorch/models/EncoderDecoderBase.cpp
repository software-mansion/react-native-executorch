#include <rnexecutorch/models/EncoderDecoderBase.h>

namespace rnexecutorch {

EncoderDecoderBase::EncoderDecoderBase(
    const std::string &encoderPath, const std::string &decoderPath,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : encoder_(std::make_unique<BaseModel>(encoderPath, callInvoker)),
      decoder_(std::make_unique<BaseModel>(decoderPath, callInvoker)),
      callInvoker(callInvoker) {}

void EncoderDecoderBase::unload() {
  encoder_.reset(nullptr);
  decoder_.reset(nullptr);
}
} // namespace rnexecutorch
