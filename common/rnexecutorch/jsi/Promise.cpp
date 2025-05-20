#include "Promise.h"

namespace rnexecutorch {

Promise::Promise(jsi::Runtime &runtime,
                 std::shared_ptr<react::CallInvoker> callInvoker,
                 jsi::Value resolver, jsi::Value rejecter)
    : runtime(runtime), callInvoker(callInvoker),
      _resolver(std::move(resolver)), _rejecter(std::move(rejecter)) {}

void Promise::resolve(jsi::Value &&result) {
  _resolver.asObject(runtime).asFunction(runtime).call(runtime, result);
}

void Promise::reject(std::string message) {
  jsi::JSError error(runtime, message);
  _rejecter.asObject(runtime).asFunction(runtime).call(runtime, error.value());
}

} // namespace rnexecutorch