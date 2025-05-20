#include "JsiPromise.h"

namespace rnexecutorch {

using namespace facebook;

jsi::Value PromiseVendor::createPromise(
    const std::function<void(std::shared_ptr<Promise>)> &function) {
  if (runtime_ == nullptr) {
    throw std::runtime_error("Runtime was null!");
  }

  auto &runtime = *runtime_;
  auto callInvoker = callInvoker_;

  // get Promise constructor
  auto promiseCtor = runtime.global().getPropertyAsFunction(runtime, "Promise");

  // create a "run" function (first Promise arg)
  auto runPromise = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forUtf8(runtime, "runPromise"), 2,
      [callInvoker,
       function](jsi::Runtime &runtime, const jsi::Value &thisValue,
                 const jsi::Value *arguments, size_t count) -> jsi::Value {
        auto resolveLocal = arguments[0].asObject(runtime).asFunction(runtime);
        auto resolve = std::make_shared<jsi::Function>(std::move(resolveLocal));
        auto rejectLocal = arguments[1].asObject(runtime).asFunction(runtime);
        auto reject = std::make_shared<jsi::Function>(std::move(rejectLocal));

        auto resolveWrapper =
            [resolve, &runtime, callInvoker](
                const std::function<jsi::Value(jsi::Runtime &)> &resolver)
            -> void {
          callInvoker->invokeAsync([resolve, &runtime, resolver]() -> void {
            auto valueShared = std::make_shared<jsi::Value>(resolver(runtime));

            resolve->call(runtime, *valueShared);
          });
        };

        auto rejectWrapper = [reject, &runtime, callInvoker](
                                 const std::string &errorMessage) -> void {
          auto error = jsi::JSError(runtime, errorMessage);
          auto errorShared = std::make_shared<jsi::JSError>(error);
          callInvoker->invokeAsync([reject, &runtime, errorShared]() -> void {
            reject->call(runtime, errorShared->value());
          });
        };

        auto promise = std::make_shared<Promise>(resolveWrapper, rejectWrapper);
        function(promise);

        return jsi::Value::undefined();
      });

  // return new Promise((resolve, reject) => ...)
  return promiseCtor.callAsConstructor(runtime, runPromise);
}

} // namespace rnexecutorch