#pragma once

#include <memory>
#include <string>
#include <thread>

#include <jsi/jsi.h>

#include "jsi/JsiPromise.h"

namespace rnexecutorch {

using namespace facebook;

class RnExecutorchInstaller {
public:
  static void
  injectJSIBindings(jsi::Runtime *jsiRuntime,
                    const std::shared_ptr<react::CallInvoker> &jsCallInvoker) {
    // Install JSI methods here
  }

private:
};

} // namespace rnexecutorch