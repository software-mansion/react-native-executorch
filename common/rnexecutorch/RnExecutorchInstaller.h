#pragma once

#include <memory>
#include <string>
#include <thread>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

namespace rnexecutorch {

using FetchUrlFunc_t = std::function<std::vector<std::byte>(std::string)>;

using namespace facebook;

class RnExecutorchInstaller {
public:
  static void
  injectJSIBindings(jsi::Runtime *jsiRuntime,
                    const std::shared_ptr<react::CallInvoker> &jsCallInvoker,
                    FetchUrlFunc_t fetchDataFromUrl);

private:
  static jsi::Function
  loadStyleTransfer(jsi::Runtime *jsiRuntime,
                    const std::shared_ptr<react::CallInvoker> &jsCallInvoker);
};

} // namespace rnexecutorch