#include "utils.h"

#include <string>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>

#if defined(__ANDROID__)
#include <sys/system_properties.h>
#elif defined(__APPLE__)
#include <TargetConditionals.h>
#endif

namespace rnexecutorch::core::utils {
namespace jsi = facebook::jsi;

namespace {
// Detects an Android emulator / iOS simulator. On Android the build
// fingerprint and hardware name identify the AVD images (goldfish and ranchu
// are the QEMU-based emulator kernels); on Apple platforms the simulator is
// known at compile time.
bool isEmulator() {
#if defined(__ANDROID__)
    auto readProp = [](const char *key) -> std::string {
#if __ANDROID_API__ >= 26
        const prop_info *pi = __system_property_find(key);
        if (pi == nullptr) {
            return "";
        }
        std::string result;
        __system_property_read_callback(
            pi,
            [](void *cookie, const char * /*name*/, const char *value, uint32_t /*serial*/) {
                *static_cast<std::string *>(cookie) = value;
            },
            &result);
        return result;
#else
        char value[PROP_VALUE_MAX] = {0};
        __system_property_get(key, value);
        return {value};
#endif
    };

    const std::string fingerprint = readProp("ro.build.fingerprint");
    const std::string hardware = readProp("ro.hardware");
    return fingerprint.rfind("generic", 0) == 0 || hardware == "goldfish" || hardware == "ranchu";
#elif defined(__APPLE__) && TARGET_OS_SIMULATOR
    return true;
#else
    return false;
#endif
}
} // namespace

void install_getExecuTorchRegisteredBackends(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "getExecuTorchRegisteredBackends";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
        if (count != 0) {
            throw jsi::JSError(rt, "Usage: getExecuTorchRegisteredBackends()");
        }

        auto registeredCount = executorch::runtime::get_num_registered_backends();
        auto jsArray = jsi::Array(rt, registeredCount);
        for (size_t i = 0; i < registeredCount; ++i) {
            auto backendName = executorch::runtime::get_backend_name(i);
            if (!backendName.ok()) {
                const std::string errorMsg = executorch::runtime::to_string(backendName.error());
                throw jsi::JSError(rt, "Failed to get backend name: " + errorMsg);
            }
            jsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, backendName.get()));
        }
        return jsArray;
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 0, fnBody);

    module.setProperty(rt, name, fn);
}

void install_isEmulator(jsi::Runtime &rt, jsi::Object &module) {
    module.setProperty(rt, "isEmulator", jsi::Value(isEmulator()));
}
} // namespace rnexecutorch::core::utils
