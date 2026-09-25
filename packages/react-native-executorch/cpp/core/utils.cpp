#include "utils.h"

#include <cstdlib>
#include <filesystem>
#include <format>
#include <optional>
#include <string>
#include <string_view>
#include <unordered_map>

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
#ifdef __ANDROID__
std::string readProp(const char *key) {
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
}
#endif

// The Hexagon (HTP) version a QNN .pte has to be compiled for, from the SoC.
// A QNN context binary targets one HTP version, so the registry publishes one
// file per version and picks it from this. Only Snapdragon parts ExecuTorch's
// QNN backend knows (backends/qualcomm/serialization/qc_schema.py) are listed.
// Returns nothing off Qualcomm, on an unlisted SoC, or when the skel for that
// version is not where the DSP will look for it (ADSP_LIBRARY_PATH, set by the
// Android module), since a QNN model could not load then.
std::optional<std::string> qnnHtpArch() {
#ifdef __ANDROID__
    static const std::unordered_map<std::string_view, int> kSocToHtp = {
        {"SM8450", 69}, {"SM8475", 69}, {"SM8550", 73}, {"SM8650", 75},
        {"SM8750", 79}, {"SM8845", 81}, {"SM8850", 81},
    };
    const auto it = kSocToHtp.find(readProp("ro.soc.model"));
    if (it == kSocToHtp.end()) {
        return std::nullopt;
    }
    const char *adspPath = std::getenv("ADSP_LIBRARY_PATH");
    if (adspPath == nullptr) {
        return std::nullopt;
    }
    const std::string_view paths{adspPath};
    const std::string firstDir{paths.substr(0, paths.find(';'))};
    std::error_code ec;
    if (!std::filesystem::exists(std::format("{}/libQnnHtpV{}Skel.so", firstDir, it->second), ec)) {
        return std::nullopt;
    }
    return std::format("v{}", it->second);
#else
    return std::nullopt;
#endif
}

// Detects an Android emulator / iOS simulator. On Android no single property
// covers every image, so we check three: the build fingerprint (`generic...`
// for AOSP images), the hardware name (`goldfish`/`ranchu` are the QEMU
// emulator kernels, `cutf`/`vsoc` prefixes are Cuttlefish virtual devices), and
// the product model (Play-store and SDK images report `sdk_gphone`,
// `google_sdk`, `Emulator` or `Cuttlefish`). On Apple platforms the simulator
// is known at compile time.
bool isEmulator() {
#ifdef __ANDROID__
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

void install_qnnHtpArch(jsi::Runtime &rt, jsi::Object &module) {
    const auto arch = qnnHtpArch();
    module.setProperty(rt, "qnnHtpArch",
                       arch ? jsi::Value(jsi::String::createFromUtf8(rt, *arch)) : jsi::Value::undefined());
}
} // namespace rnexecutorch::core::utils
