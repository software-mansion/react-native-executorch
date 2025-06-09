#pragma once

#include <string>

#include <ReactCommon/CallInvoker.h>
#include <executorch/extension/module/module.h>
#include <filesystem>
#include <jsi/jsi.h>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/utils/JsiTensorView.h>

namespace rnexecutorch {

using namespace facebook;

class ExecutorchModule {
public:
  // note: this needs to be refactored due to the fact that both BaseModel and
  // ExecuTorch module implement this separately, which is pretty error-prone.
  // possibly we need to make ExecutorchModule a BaseModel.
  std::size_t getMemoryLowerBound();
  void unload();

  ExecutorchModule(const std::string &modelSource,
                   std::shared_ptr<facebook::react::CallInvoker> callInvoker);
  std::vector<int32_t> getInputShape(std::string method_name, int index);
  std::vector<std::shared_ptr<OwningArrayBuffer>>
  forward(std::vector<JsiTensorView> tensorViewVec);
  std::size_t memorySizeLowerBound{0};

protected:
  std::unique_ptr<executorch::extension::Module> module;
  std::shared_ptr<facebook::react::CallInvoker> callInvoker;
};

} // namespace rnexecutorch