#pragma once

#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/models/BaseModel.h>
#include <string>

namespace rnexecutorch {
using namespace facebook;
class EncoderDecoderBase {
public:
  EncoderDecoderBase(const std::string &encoderPath,
                     const std::string &decoderPath,
                     std::shared_ptr<react::CallInvoker> callInvoker);

  std::vector<JSTensorViewOut> encode(std::vector<JSTensorViewIn> input);
  std::vector<JSTensorViewOut> decode(std::vector<JSTensorViewIn> input);
  size_t getMemoryLowerBound();
  void unload();

protected:
  std::shared_ptr<react::CallInvoker> callInvoker;

private:
  std::unique_ptr<BaseModel> encoder_;
  std::unique_ptr<BaseModel> decoder_;
  size_t memorySizeLowerBound;
};
} // namespace rnexecutorch
