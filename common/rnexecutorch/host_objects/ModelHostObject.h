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
    addFunctions(JSI_EXPORT_FUNCTION(ModelHostObject<Model>, forward));
  }

  JSI_HOST_FUNCTION(forward) {
    auto promise = Promise::createPromise(
        runtime, callInvoker,
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

          // We need to dispatch a thread if we want the forward to be
          // asynchronous
          std::thread([args, &runtime, this, promise = std::move(promise)]() {
            try {
              auto argsConverted = jsiconversion::createArgsTupleFromJsi(
                  &Model::forward, args, runtime);
              auto result = std::apply(std::bind_front(&Model::forward, model),
                                       argsConverted);

              promise->resolve(
                  jsiconversion::getJsiValue(std::move(result), runtime));
            } catch (const std::runtime_error &e) {
              // This catch should be merged with the next two
              // (std::runtime_error and jsi::JSError inherits from
              // std::exception) HOWEVER react native has broken RTTI which
              // breaks proper exception type checking. Remove when the
              // following change is present in our version:
              // https://github.com/facebook/react-native/commit/3132cc88dd46f95898a756456bebeeb6c248f20e
              promise->reject(e.what());
              return;
            } catch (const jsi::JSError &e) {
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
  std::shared_ptr<react::CallInvoker> callInvoker;
};

} // namespace rnexecutorch