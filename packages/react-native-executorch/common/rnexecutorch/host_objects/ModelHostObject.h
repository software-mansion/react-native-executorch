#pragma once

#include <cstdio>
#include <string>
#include <tuple>
#include <vector>

#include <ReactCommon/CallInvoker.h>

#include <rnexecutorch/Log.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/jsi/JsiHostObject.h>
#include <rnexecutorch/jsi/Promise.h>

namespace rnexecutorch {

template <typename Model> class ModelHostObject : public JsiHostObject {
public:
  explicit ModelHostObject(const std::shared_ptr<Model> &model,
                           std::shared_ptr<react::CallInvoker> callInvoker)
      : model(model), callInvoker(callInvoker) {
    addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>,
                                     promiseHostFunction<&Model::forward>,
                                     "forward"));
  }

  // A generic host function that resolves a promise with a result of a
  // function. JSI arguments are converted to the types provided in the function
  // signature, and the return value is converted back to JSI before resolving.
  template <auto FnPtr> JSI_HOST_FUNCTION(promiseHostFunction) {
    auto promise = Promise::createPromise(
        runtime, callInvoker,
        [this, count, args, &runtime](std::shared_ptr<Promise> promise) {
          constexpr std::size_t functionArgCount =
              jsiconversion::getArgumentCount(FnPtr);
          if (functionArgCount != count) {
            char errorMessage[100];
            std::snprintf(
                errorMessage, sizeof(errorMessage),
                "Argument count mismatch, was expecting: %zu but got: %zu",
                functionArgCount, count);
            promise->reject(errorMessage);
            return;
          }

          try {
            auto argsConverted =
                jsiconversion::createArgsTupleFromJsi(FnPtr, args, runtime);

            // We need to dispatch a thread if we want the function to be
            // asynchronous. In this thread all accesses to jsi::Runtime need to
            // be done via the callInvoker.
            std::thread([this, promise,
                         argsConverted = std::move(argsConverted)]() {
              try {
                auto result =
                    std::apply(std::bind_front(FnPtr, model), argsConverted);
                // The result is copied. It should either be quickly copiable,
                // or passed with a shared_ptr.
                callInvoker->invokeAsync([promise,
                                          result](jsi::Runtime &runtime) {
                  promise->resolve(
                      jsiconversion::getJsiValue(std::move(result), runtime));
                });
              } catch (const std::runtime_error &e) {
                // This catch should be merged with the next two
                // (std::runtime_error and jsi::JSError inherits from
                // std::exception) HOWEVER react native has broken RTTI which
                // breaks proper exception type checking. Remove when the
                // following change is present in our version:
                // https://github.com/facebook/react-native/commit/3132cc88dd46f95898a756456bebeeb6c248f20e
                callInvoker->invokeAsync(
                    [&e, promise]() { promise->reject(e.what()); });
                return;
              } catch (const jsi::JSError &e) {
                callInvoker->invokeAsync(
                    [&e, promise]() { promise->reject(e.what()); });
                return;
              } catch (const std::exception &e) {
                callInvoker->invokeAsync(
                    [&e, promise]() { promise->reject(e.what()); });
                return;
              } catch (...) {
                callInvoker->invokeAsync(
                    [promise]() { promise->reject("Unknown error"); });
                return;
              }
            }).detach();
          } catch (...) {
            promise->reject("Couldn't parse JS arguments in a native function");
          }
        });

    return promise;
  }

private:
  std::shared_ptr<Model> model;
  std::shared_ptr<react::CallInvoker> callInvoker;
};

} // namespace rnexecutorch