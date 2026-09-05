#include "error.h"

namespace rnexecutorch::core::error {

void throwJsiRnExecuTorchError(jsi::Runtime &rt, const RnExecuTorchException &e) {
    auto errorCtor = rt.global().getPropertyAsFunction(rt, "Error");
    auto errObj = errorCtor.call(rt, jsi::String::createFromUtf8(rt, e.what())).asObject(rt);

    errObj.setProperty(rt, "name", jsi::String::createFromUtf8(rt, "RnExecuTorchError"));
    errObj.setProperty(rt, "code", jsi::String::createFromUtf8(rt, errorCodeToString(e.code_)));

    if (e.etRuntimeErrorCode_.has_value()) {
        errObj.setProperty(rt, "etRuntimeErrorCode", *e.etRuntimeErrorCode_);
    }

    throw jsi::JSError(rt, jsi::Value(std::move(errObj)));
}

} // namespace rnexecutorch::core::error
