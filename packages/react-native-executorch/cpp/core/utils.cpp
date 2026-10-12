#include "utils.h"

#include <algorithm>
#include <cctype>
#include <format>
#include <string>
#include <vector>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>

#include "core/error.h"

#ifdef __ANDROID__
#include <sys/system_properties.h>
#elif defined(__APPLE__)
#include <TargetConditionals.h>
#endif

namespace rnexecutorch::core::utils {
namespace jsi = facebook::jsi;

namespace {
// Detects an Android emulator / iOS simulator. On Android no single property
// covers every image, so we check three: the build fingerprint (`generic...`
// for AOSP images), the hardware name (`goldfish`/`ranchu` are the QEMU
// emulator kernels, `cutf`/`vsoc` prefixes are Cuttlefish virtual devices), and
// the product model (Play-store and SDK images report `sdk_gphone`,
// `google_sdk`, `Emulator` or `Cuttlefish`). On Apple platforms the simulator
// is known at compile time.
bool isEmulator() {
#ifdef __ANDROID__
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

    const auto startsWith = [](const std::string &value, const char *prefix) {
        return value.rfind(prefix, 0) == 0;
    };

    const std::string fingerprint = readProp("ro.build.fingerprint");
    if (startsWith(fingerprint, "generic") || startsWith(fingerprint, "unknown")) {
        return true;
    }

    const std::string hardware = readProp("ro.hardware");
    if (hardware == "goldfish" || hardware == "ranchu" || startsWith(hardware, "cutf") ||
        startsWith(hardware, "vsoc")) {
        return true;
    }

    const std::string model = readProp("ro.product.model");
    return model.find("sdk_gphone") != std::string::npos ||
           model.find("google_sdk") != std::string::npos ||
           model.find("Emulator") != std::string::npos ||
           model.find("Android SDK built for") != std::string::npos ||
           model.find("Cuttlefish") != std::string::npos;
#elif defined(__APPLE__) && TARGET_OS_SIMULATOR
    return true;
#else
    return false;
#endif
}
} // namespace

std::optional<std::string> diagnoseBackends(const executorch::runtime::MethodMeta &methodMeta) {
    std::vector<std::string> missing;
    std::vector<std::string> appleOnly;
    for (size_t i = 0; i < methodMeta.num_backends(); ++i) {
        auto name = methodMeta.get_backend_name(i);
        if (!name.ok() || !methodMeta.uses_backend(name.get())) {
            continue;
        }
        std::string lower = name.get();
        std::ranges::transform(lower, lower.begin(), [](unsigned char c) { return std::tolower(c); });
        if (lower.starts_with("coreml") || lower.starts_with("mlx")) {
            appleOnly.emplace_back(name.get());
        }
        if (executorch::runtime::get_backend_class(name.get()) == nullptr) {
            missing.emplace_back(name.get());
        }
    }

    const auto join = [](const std::vector<std::string> &names) {
        std::string out;
        for (const auto &name : names) {
            out += out.empty() ? name : ", " + name;
        }
        return out;
    };

    // The simulator links Core ML but cannot run it, and MLX ships no
    // simulator slice at all, so on a simulator both read as one case.
    if (isEmulator() && !appleOnly.empty()) {
        return std::format("This model uses {}, which the iOS simulator cannot run. Use an XNNPACK variant "
                           "instead; the registry's `DEFAULT` picks one on the simulator.",
                           join(appleOnly));
    }
    if (!missing.empty()) {
        return std::format("This model uses {}, which this app was not built with. Enable it in the "
                           "`react-native-executorch` block of package.json, reinstall, and rebuild, or use a "
                           "variant for a backend `getRegisteredBackends()` lists.",
                           join(missing));
    }
    return std::nullopt;
}

void install_getExecuTorchRegisteredBackends(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "getExecuTorchRegisteredBackends";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
        if (count != 0) {
            throw error::InvalidArgument("getExecuTorchRegisteredBackends: Usage: getExecuTorchRegisteredBackends()");
        }

        auto registeredCount = executorch::runtime::get_num_registered_backends();
        auto jsArray = jsi::Array(rt, registeredCount);
        for (size_t i = 0; i < registeredCount; ++i) {
            auto backendName = executorch::runtime::get_backend_name(i);
            if (!backendName.ok()) {
                const std::string errorMsg = executorch::runtime::to_string(backendName.error());
                throw error::Unknown(std::format("getExecuTorchRegisteredBackends: Failed to get backend name: {}", errorMsg),
                                     backendName.error());
            }
            jsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, backendName.get()));
        }
        return jsArray;
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 0, error::guarded(fnBody));

    module.setProperty(rt, name, fn);
}

void install_isEmulator(jsi::Runtime &rt, jsi::Object &module) {
    module.setProperty(rt, "isEmulator", jsi::Value(isEmulator()));
}
} // namespace rnexecutorch::core::utils
