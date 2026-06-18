#include "utils.h"

#include <string>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>

namespace rnexecutorch::core::utils {
namespace jsi = facebook::jsi;

void install_getExecuTorchRegisteredBackends(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "getExecuTorchRegisteredBackends";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 0) {
            throw jsi::JSError(rt, "Usage: getExecuTorchRegisteredBackends()");
        }

        auto registeredCount = executorch::runtime::get_num_registered_backends();
        auto jsArray = jsi::Array(rt, registeredCount);
        for (size_t i = 0; i < registeredCount; ++i) {
            auto backendName = executorch::runtime::get_backend_name(i);
            if (!backendName.ok()) {
                std::string errorMsg = executorch::runtime::to_string(backendName.error());
                throw jsi::JSError(rt, "Failed to get backend name: " + errorMsg);
            }
            jsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, backendName.get()));
        }
        return jsArray;
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 0, fnBody);

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::core::utils
