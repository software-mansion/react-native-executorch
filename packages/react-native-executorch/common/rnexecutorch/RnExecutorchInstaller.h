#include <memory>
#include <string>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/host_objects/ModelHostObject.h>
#include <rnexecutorch/jsi/Promise.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/metaprogramming/FunctionHelpers.h>
#include <rnexecutorch/metaprogramming/TypeConcepts.h>
#include <rnexecutorch/threads/GlobalThreadPool.h>

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
    requires meta::ValidConstructorTraits<ModelT> &&
             meta::CallInvokerLastInConstructor<ModelT> &&
             meta::ProvidesMemoryLowerBound<ModelT>
  static jsi::Function
  loadModel(jsi::Runtime *jsiRuntime,
            std::shared_ptr<react::CallInvoker> jsCallInvoker,
            const std::string &loadFunctionName) {
    return jsi::Function::createFromHostFunction(
        *jsiRuntime, jsi::PropNameID::forAscii(*jsiRuntime, loadFunctionName),
        0,
        [jsCallInvoker](jsi::Runtime &runtime, const jsi::Value &thisValue,
                        const jsi::Value *args, size_t count) -> jsi::Value {
          constexpr std::size_t expectedCount = std::tuple_size_v<
              typename meta::ConstructorTraits<ModelT>::arg_types>;
          // count doesn't account for the JSCallInvoker
          if (count != expectedCount - 1) {
            char errorMessage[100];
            std::snprintf(
                errorMessage, sizeof(errorMessage),
                "Argument count mismatch, was expecting: %zu but got: %zu",
                expectedCount, count);
            throw jsi::JSError(runtime, errorMessage);
          }

          // Parse JSI arguments on the JS thread (required for jsi::Value
          // access), then dispatch the heavy model construction to a background
          // thread and return a Promise.
          auto constructorArgs =
              meta::createConstructorArgsWithCallInvoker<ModelT>(
                  args, runtime, jsCallInvoker);

          return Promise::createPromise(
              runtime, jsCallInvoker,
              [jsCallInvoker,
               constructorArgs =
                   std::move(constructorArgs)](std::shared_ptr<Promise> promise) {
                threads::GlobalThreadPool::detach(
                    [jsCallInvoker, promise,
                     constructorArgs = std::move(constructorArgs)]() {
                      try {
                        auto modelImplementationPtr = std::apply(
                            [](auto &&...unpackedArgs) {
                              return std::make_shared<ModelT>(
                                  std::forward<decltype(unpackedArgs)>(
                                      unpackedArgs)...);
                            },
                            std::move(constructorArgs));

                        auto modelHostObject =
                            std::make_shared<ModelHostObject<ModelT>>(
                                modelImplementationPtr, jsCallInvoker);

                        auto memoryLowerBound =
                            modelImplementationPtr->getMemoryLowerBound();

                        jsCallInvoker->invokeAsync(
                            [promise, modelHostObject,
                             memoryLowerBound](jsi::Runtime &rt) {
                              auto jsiObject =
                                  jsi::Object::createFromHostObject(
                                      rt, modelHostObject);
                              jsiObject.setExternalMemoryPressure(
                                  rt, memoryLowerBound);
                              promise->resolve(std::move(jsiObject));
                            });
                      } catch (const rnexecutorch::RnExecutorchError &e) {
                        auto code = e.getNumericCode();
                        auto msg = std::string(e.what());
                        jsCallInvoker->invokeAsync(
                            [promise, code, msg](jsi::Runtime &rt) {
                              jsi::Object errorData(rt);
                              errorData.setProperty(rt, "code", code);
                              errorData.setProperty(
                                  rt, "message",
                                  jsi::String::createFromUtf8(rt, msg));
                              promise->reject(
                                  jsi::Value(rt, std::move(errorData)));
                            });
                      } catch (const std::runtime_error &e) {
                        jsCallInvoker->invokeAsync(
                            [promise, msg = std::string(e.what())]() {
                              promise->reject(msg);
                            });
                      } catch (const std::exception &e) {
                        jsCallInvoker->invokeAsync(
                            [promise, msg = std::string(e.what())]() {
                              promise->reject(msg);
                            });
                      } catch (...) {
                        jsCallInvoker->invokeAsync([promise]() {
                          promise->reject(std::string("Unknown error"));
                        });
                      }
                    });
              });
        });
  }
};
} // namespace rnexecutorch
