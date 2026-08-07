#include "error.h"

namespace rnexecutorch::core::error {

jsi::Value makeJsError(jsi::Runtime &rt, ErrorCode code, const std::string &message,
                       std::optional<int32_t> etCode) {
    auto errorObj = rt.global()
                        .getPropertyAsFunction(rt, "Error")
                        .callAsConstructor(rt, jsi::String::createFromUtf8(rt, message))
                        .asObject(rt);

    errorObj.setProperty(rt, "name", jsi::String::createFromUtf8(rt, "RnExecutorchError"));
    errorObj.setProperty(rt, "code", static_cast<int32_t>(code));
    if (etCode.has_value()) {
        errorObj.setProperty(rt, "etCode", *etCode);
    }

    return jsi::Value(std::move(errorObj));
}

void throwJs(jsi::Runtime &rt, ErrorCode code, const std::string &message,
             std::optional<int32_t> etCode) {
    throw jsi::JSError(rt, makeJsError(rt, code, message, etCode));
}

} // namespace rnexecutorch::core::error
