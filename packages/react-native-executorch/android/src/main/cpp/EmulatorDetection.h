#pragma once

#include <string>
#include <sys/system_properties.h>

namespace rnexecutorch {

inline bool isEmulator() {
  auto readProp = [](const char *key) -> std::string {
#if __ANDROID_API__ >= 26
    const prop_info *pi = __system_property_find(key);
    if (pi == nullptr) {
      return "";
    }
    std::string result;
    __system_property_read_callback(
        pi,
        [](void *cookie, const char * /*__name*/, const char *value,
           uint32_t /*__serial*/) {
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

  std::string fp = readProp("ro.build.fingerprint");
  std::string hw = readProp("ro.hardware");
  return fp.find("generic") == 0 || hw == "goldfish" || hw == "ranchu";
}

} // namespace rnexecutorch
