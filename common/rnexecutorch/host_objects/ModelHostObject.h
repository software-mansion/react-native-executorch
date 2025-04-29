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
          std::thread([this, promise = std::move(promise), count, args,
                       &runtime]() {
            constexpr std::size_t forwardArgCount =
                jsiconversion::getArgumentCount(&Model::forward);
            if (forwardArgCount != count) {
              promise->reject("Argument count mismatch");
              return;
            }

            try {
              auto argsConverted = jsiconversion::createArgsTupleFromJsi(
                  &Model::forward, args, runtime);
              promise->resolve([this, argsConverted = std::move(argsConverted)](
                                   jsi::Runtime &runtime) {
                auto result = std::apply(
                    std::bind_front(&Model::forward, model), argsConverted);
                auto resultValue =
                    jsiconversion::getJsiValue(std::move(result), runtime);
                return resultValue;
              });
            } catch (const std::exception &e) {
              promise->reject(e.what());
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