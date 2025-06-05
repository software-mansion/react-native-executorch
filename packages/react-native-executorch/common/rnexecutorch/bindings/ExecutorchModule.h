#pragma once

#include <string>

#include <ReactCommon/CallInvoker.h>
#include <executorch/extension/module/module.h>
#include <jsi/jsi.h>
#include <rnexecutorch/utils/JsiTensorView.h>

namespace rnexecutorch {

class ExecutorchModule {
public:
  ExecutorchModule(const std::string &modelSource,
                   std::shared_ptr<facebook::react::CallInvoker> callInvoker);
  std::vector<int32_t> getInputShape(std::string method_name, int index);
  int forward(std::vector<JsiTensorView> tensorViewVec);

protected:
  std::unique_ptr<executorch::extension::Module> module;
  std::shared_ptr<facebook::react::CallInvoker> callInvoker;
};

} // namespace rnexecutorch