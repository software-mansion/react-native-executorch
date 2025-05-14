#pragma once

#include <memory>
#include <string>
#include <thread>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/host_objects/ModelHostObject.h>

namespace rnexecutorch {

using FetchUrlFunc_t = std::function<std::vector<std::byte>(std::string)>;
extern FetchUrlFunc_t fetchUrlFunc;

using namespace facebook;

class RnExecutorchInstaller {
public:
  static void
  injectJSIBindings(jsi::Runtime *jsiRuntime,
                    std::shared_ptr<react::CallInvoker> jsCallInvoker,
                    FetchUrlFunc_t fetchDataFromUrl);

private:
  template <typename ModelT>
  static jsi::Function
  loadModel(jsi::Runtime *jsiRuntime,
            std::shared_ptr<react::CallInvoker> jsCallInvoker,
            const std::string &loadFunctionName) {
    return jsi::Function::createFromHostFunction(
        *jsiRuntime,
        jsi::PropNameID::forAscii(*jsiRuntime, loadFunctionName.c_str()), 0,
        [jsCallInvoker](jsi::Runtime &runtime, const jsi::Value &thisValue,
                        const jsi::Value *args, size_t count) -> jsi::Value {
          // We expect a single input -- the path to the model binary
          assert(count == 1);
          auto source = jsiconversion::getValue<std::string>(args[0], runtime);

          auto modelImplementationPtr =
              std::make_shared<ModelT>(source, &runtime);
          auto modelHostObject = std::make_shared<ModelHostObject<ModelT>>(
              modelImplementationPtr, jsCallInvoker);

          return jsi::Object::createFromHostObject(runtime, modelHostObject);
          return jsi::Value();
        });
  }
};

} // namespace rnexecutorch