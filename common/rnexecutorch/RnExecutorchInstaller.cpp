#include "RnExecutorchInstaller.h"

#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/host_objects/ModelHostObject.h>
#include <rnexecutorch/models/StyleTransfer.h>

namespace rnexecutorch {

// This function fetches data from a url address. It is implemented in
// Kotlin/ObjectiveC++ and then bound to this variable. It's done to not handle
// SSL intricacies manually, as it is done automagically in ObjC++/Kotlin.
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
        try {
          auto source = jsiconversion::getValue<std::string>(args[0], runtime);

          auto styleTransferPtr =
              std::make_shared<StyleTransfer>(source, &runtime);
          auto styleTransferHostObject =
              std::make_shared<ModelHostObject<StyleTransfer>>(styleTransferPtr,
                                                               jsCallInvoker);

          return jsi::Object::createFromHostObject(runtime,
                                                   styleTransferHostObject);
        } catch (const std::runtime_error &e) {
          // This catch should be merged with the next one
          // (std::runtime_error inherits from std::exception) HOWEVER react
          // native has broken RTTI which breaks proper exception type
          // checking. Remove when the following change is present in our
          // version:
          // https://github.com/facebook/react-native/commit/3132cc88dd46f95898a756456bebeeb6c248f20e
          throw jsi::JSError(runtime, e.what());
          return jsi::Value();
        } catch (const std::exception &e) {
          throw jsi::JSError(runtime, e.what());
          return jsi::Value();
          ;
        } catch (...) {
          throw jsi::JSError(runtime, "Unknown error");
          return jsi::Value();
          ;
        }
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