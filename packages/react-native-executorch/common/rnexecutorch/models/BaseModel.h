#pragma once

#include <string>
#include <vector>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <executorch/extension/module/module.h>
#include <jsi/jsi.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/host_objects/JSTensorViewOut.h>

namespace rnexecutorch {
namespace models {
using namespace facebook;
using executorch::runtime::EValue;
using executorch::runtime::Result;
class BaseModel {
public:
  BaseModel(const std::string &modelSource,
            std::shared_ptr<react::CallInvoker> callInvoker);
  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;
  std::vector<int32_t> getInputShape(std::string method_name, int32_t index);
  std::vector<std::vector<int32_t>>
  getAllInputShapes(std::string methodName = "forward");
  std::vector<JSTensorViewOut>
  forwardJS(std::vector<JSTensorViewIn> tensorViewVec);
  Result<std::vector<EValue>> forward(const EValue &input_value) const;
  Result<std::vector<EValue>>
  forward(const std::vector<EValue> &input_value) const;
  Result<std::vector<EValue>> execute(const std::string &methodName,
                                      const std::vector<EValue> &input_value);
  Result<executorch::runtime::MethodMeta>
  getMethodMeta(const std::string &methodName);

protected:
  // If possible, models should not use the JS runtime to keep JSI internals
  // away from logic, however, sometimes this would incur too big of a penalty
  // (unnecessary copies instead of working on JS memory). In this case
  // CallInvoker can be used to get jsi::Runtime, and use it in a safe manner.
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<executorch::extension::Module> module_;

private:
  std::size_t memorySizeLowerBound{0};
  std::vector<int32_t> getTensorShape(const executorch::aten::Tensor &tensor);
};
} // namespace models

REGISTER_CONSTRUCTOR(models::BaseModel, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
