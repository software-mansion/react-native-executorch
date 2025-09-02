#pragma once

#include <ReactCommon/CallInvoker.h>
#include <memory>
#include <rnexecutorch/models/BaseModel.h>
#include <string>

namespace rnexecutorch::models {

using namespace facebook;
using executorch::aten::Tensor;
using executorch::runtime::EValue;

class PipelineBase {
public:
  explicit PipelineBase(
    const std::string &tokenizerPath,
    const std::string &schedulerPath,
    const std::string &encoderPath,
    const std::string &transformerPath,
    const std::string &decoderPath,
    
    std::shared_ptr<react::CallInvoker> callInvoker);
  size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

protected:
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<BaseModel> encoder_;
  std::unique_ptr<BaseModel> transformer_;
  std::unique_ptr<BaseModel> decoder_;

private:
  size_t memorySizeLowerBound;
};

} // namespace rnexecutorch::models
