#include "Promise.h"

namespace rnexecutorch {

Promise::Promise(jsi::Runtime &runtime,
                 std::shared_ptr<react::CallInvoker> callInvoker,
                 jsi::Value resolver, jsi::Value rejecter)
    : runtime(runtime), callInvoker(callInvoker),
      _resolver(std::move(resolver)), _rejecter(std::move(rejecter)) {}

void Promise::resolve(jsi::Value &&result) {
  // invokeAsync takes a std::function which is copyable so we need to wrap
  // the jsi::Value which is not.
  auto resultPtr = std::make_shared<jsi::Value>(std::move(result));
  callInvoker->invokeAsync([resultPtr, this]() -> void {
    _resolver.asObject(runtime).asFunction(runtime).call(runtime,
                                                         std::move(*resultPtr));
  });
}

void Promise::reject(std::string message) {
  callInvoker->invokeAsync([message = std::move(message), this]() -> void {
    jsi::JSError error(runtime, message);
    _rejecter.asObject(runtime).asFunction(runtime).call(runtime,
                                                         error.value());
  });
}

} // namespace rnexecutorch