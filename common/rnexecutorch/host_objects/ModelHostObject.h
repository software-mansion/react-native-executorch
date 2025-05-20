#pragma once

#include <cstdio>
#include <string>
#include <tuple>
#include <vector>

#include <rnexecutorch/Log.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/jsi/JsiHostObject.h>
#include <rnexecutorch/jsi/JsiPromise.h>

namespace rnexecutorch {

template <typename Model> class ModelHostObject : public JsiHostObject {
public:
  explicit ModelHostObject(
      const std::shared_ptr<Model> &model, jsi::Runtime *runtime,
      const std::shared_ptr<react::CallInvoker> &callInvoker)
      : model(model), promiseVendor(runtime, callInvoker) {
    addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject, forward));
  }

  JSI_HOST_FUNCTION(forward) {
    auto promise = promiseVendor.createPromise(
        [this, count, args, &runtime](std::shared_ptr<Promise> promise) {
          constexpr std::size_t forwardArgCount =
              jsiconversion::getArgumentCount(&Model::forward);
          if (forwardArgCount != count) {
            char errorMessage[100];
            std::snprintf(
                errorMessage, sizeof(errorMessage),
                "Argument count mismatch, was expecting: %zu but got: %zu",
                forwardArgCount, count);

            promise->reject(errorMessage);
            return;
          }

          // Do the asynchronous work
          std::thread([this, promise = std::move(promise), args, &runtime]() {
            try {
              auto argsConverted = jsiconversion::createArgsTupleFromJsi(
                  &Model::forward, args, runtime);
              auto result = std::apply(std::bind_front(&Model::forward, model),
                                       argsConverted);

              promise->resolve([result =
                                    std::move(result)](jsi::Runtime &runtime) {
                return jsiconversion::getJsiValue(std::move(result), runtime);
              });
            } catch (const std::runtime_error &e) {
              // This catch should be merged with the next one
              // (std::runtime_error inherits from std::exception) HOWEVER react
              // native has broken RTTI which breaks proper exception type
              // checking. Remove when the following change is present in our
              // version:
              // https://github.com/facebook/react-native/commit/3132cc88dd46f95898a756456bebeeb6c248f20e
              promise->reject(e.what());
              return;
            } catch (const std::exception &e) {
              promise->reject(e.what());
              return;
            } catch (...) {
              promise->reject("Unknown error");
              return;
            }
          }).detach();
        });

    return promise;
  }

private:
  std::shared_ptr<Model> model;
  PromiseVendor promiseVendor;
};

} // namespace rnexecutorch