#include "RnExecutorchInstaller.h"

#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/host_objects/ModelHostObject.h>
#include <rnexecutorch/jsi/JsiPromise.h>
#include <rnexecutorch/models/StyleTransfer.h>

namespace rnexecutorch {

FetchUrlFunc_t fetchUrlFunc;

jsi::Function RnExecutorchInstaller::loadStyleTransfer(
    jsi::Runtime *jsiRuntime,
    const std::shared_ptr<react::CallInvoker> &jsCallInvoker) {
  return jsi::Function::createFromHostFunction(
      *jsiRuntime, jsi::PropNameID::forAscii(*jsiRuntime, "loadStyleTransfer"),
      0,
      [jsCallInvoker](jsi::Runtime &runtime, const jsi::Value &thisValue,
                      const jsi::Value *args, size_t count) -> jsi::Value {
        assert(count == 1);
        auto source = jsiconversion::getValue<std::string>(args[0], runtime);

        auto styleTransferPtr =
            std::make_shared<StyleTransfer>(source, &runtime);
        auto styleTransferHostObject =
            std::make_shared<ModelHostObject<StyleTransfer>>(
                styleTransferPtr, &runtime, jsCallInvoker);

        return jsi::Object::createFromHostObject(runtime,
                                                 styleTransferHostObject);
      });
}

void RnExecutorchInstaller::injectJSIBindings(
    jsi::Runtime *jsiRuntime,
    const std::shared_ptr<react::CallInvoker> &jsCallInvoker,
    FetchUrlFunc_t fetchDataFromUrl) {
  fetchUrlFunc = fetchDataFromUrl;

  jsiRuntime->global().setProperty(
      *jsiRuntime, "loadStyleTransfer",
      loadStyleTransfer(jsiRuntime, jsCallInvoker));
}
} // namespace rnexecutorch