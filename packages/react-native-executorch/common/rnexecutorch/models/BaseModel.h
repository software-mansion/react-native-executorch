#pragma once

#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <executorch/extension/module/module.h>
#include <jsi/jsi.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/host_objects/JSTensorViewOut.h>

namespace rnexecutorch {
using namespace facebook;
using executorch::runtime::EValue;
using executorch::runtime::Result;
class BaseModel {
public:
  BaseModel(const std::string &modelSource,
            std::shared_ptr<react::CallInvoker> callInvoker);
  std::size_t getMemoryLowerBound();
  void unload();
  std::vector<int32_t> getInputShape(std::string method_name, int index);
  std::vector<std::vector<int32_t>>
  getAllInputShapes(std::string methodName = "forward");
  std::vector<JSTensorViewOut>
  forwardJS(std::vector<JSTensorViewIn> tensorViewVec);

protected:
  Result<std::vector<EValue>> forward(const EValue &input_value);
  Result<std::vector<EValue>> forward(const std::vector<EValue> &input_value);
  // If possible, models should not use the JS runtime to keep JSI internals
  // away from logic, however, sometimes this would incur too big of a penalty
  // (unnecessary copies instead of working on JS memory). In this case
  // CallInvoker can be used to get jsi::Runtime, and use it in a safe manner.
  std::shared_ptr<react::CallInvoker> callInvoker;

private:
  std::size_t memorySizeLowerBound{0};
  std::unique_ptr<executorch::extension::Module> module;
  std::vector<int32_t> getTensorShape(const executorch::aten::Tensor &tensor);
};
} // namespace rnexecutorch