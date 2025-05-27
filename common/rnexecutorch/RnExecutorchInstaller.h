#pragma once

#include <memory>
#include <string>
#include <thread>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include <rnexecutorch/TypeConstraints.h>
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
  template <DerivedFromBaseModel ModelT>
  static jsi::Function
  loadModel(jsi::Runtime *jsiRuntime,
            std::shared_ptr<react::CallInvoker> jsCallInvoker,
            const std::string &loadFunctionName) {

    return jsi::Function::createFromHostFunction(
        *jsiRuntime, jsi::PropNameID::forAscii(*jsiRuntime, loadFunctionName),
        0,
        [jsCallInvoker](jsi::Runtime &runtime, const jsi::Value &thisValue,
                        const jsi::Value *args, size_t count) -> jsi::Value {
          if (count != 1) {
            char errorMessage[100];
            std::snprintf(
                errorMessage, sizeof(errorMessage),
                "Argument count mismatch, was expecting: 1 but got: %zu",
                count);
            throw jsi::JSError(runtime, errorMessage);
          }
          try {
            auto source =
                jsiconversion::getValue<std::string>(args[0], runtime);

            auto modelImplementationPtr =
                std::make_shared<ModelT>(source, jsCallInvoker);
            auto modelHostObject = std::make_shared<ModelHostObject<ModelT>>(
                modelImplementationPtr, jsCallInvoker);

            auto jsiObject =
                jsi::Object::createFromHostObject(runtime, modelHostObject);
            jsiObject.setExternalMemoryPressure(
                runtime, modelImplementationPtr->getMemoryLowerBound());
            return jsiObject;
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
          } catch (...) {
            throw jsi::JSError(runtime, "Unknown error");
            return jsi::Value();
          }
        });
  }
};

} // namespace rnexecutorch