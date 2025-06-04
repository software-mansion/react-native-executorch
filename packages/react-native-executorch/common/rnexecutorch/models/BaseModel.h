#pragma once

#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <executorch/extension/module/module.h>
#include <jsi/jsi.h>

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
  std::vector<std::vector<int32_t>> getAllInputShapes();

protected:
  Result<std::vector<EValue>> forwardET(const EValue &input_value);
  // If possible, models should not use the JS runtime to keep JSI internals
  // away from logic, however, sometimes this would incur too big of a penalty
  // (unnecessary copies instead of working on JS memory). In this case
  // CallInvoker can be used to get jsi::Runtime, and use it in a safe manner.
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::size_t memorySizeLowerBound{0};

private:
  std::unique_ptr<executorch::extension::Module> module;
};
} // namespace rnexecutorch