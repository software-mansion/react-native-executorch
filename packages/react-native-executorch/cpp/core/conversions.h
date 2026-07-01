#pragma once

#include <cstddef>
#include <cstdint>
#include <format>
#include <optional>
#include <string>
#include <type_traits>
#include <vector>

#include <jsi/jsi.h>

namespace rnexecutorch::core::conversions {
namespace jsi = facebook::jsi;

template <typename T>
T asType(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val);

template <>
inline jsi::Value asType<jsi::Value>(jsi::Runtime &rt, const std::string & /*ctx*/, const jsi::Value &val) {
    return jsi::Value(rt, val);
}

template <typename T>
T getRequiredProperty(jsi::Runtime &rt, const std::string &ctx, const jsi::Object &obj, const std::string &propName) {
    if (!obj.hasProperty(rt, propName.c_str())) {
        throw jsi::JSError(rt, std::format("{}: option '{}' is required", ctx, propName));
    }
    return asType<T>(rt, std::format("{}: option '{}'", ctx, propName), obj.getProperty(rt, propName.c_str()));
}

template <typename T>
std::optional<T> getOptionalProperty(jsi::Runtime &rt, const std::string &ctx, const jsi::Object &obj, const std::string &propName) {
    if (!obj.hasProperty(rt, propName.c_str())) {
        return std::nullopt;
    }
    auto val = obj.getProperty(rt, propName.c_str());
    if (val.isUndefined() || val.isNull()) {
        return std::nullopt;
    }
    return asType<T>(rt, std::format("{}: option '{}'", ctx, propName), val);
}

template <typename T>
std::vector<T> asVector(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isObject() || !val.asObject(rt).isArray(rt)) {
        throw jsi::JSError(rt, std::format("{} must be an Array", ctx));
    }
    auto arr = val.asObject(rt).asArray(rt);
    std::vector<T> vec;
    const size_t len = arr.size(rt);
    vec.reserve(len);
    for (size_t i = 0; i < len; ++i) {
        vec.push_back(asType<T>(rt, std::format("{}[{}]", ctx, i), arr.getValueAtIndex(rt, i)));
    }
    return vec;
}

template <typename T>
jsi::Array toJsiArray(jsi::Runtime &rt, const std::vector<T> &vec) {
    jsi::Array arr(rt, vec.size());
    for (size_t i = 0; i < vec.size(); ++i) {
        if constexpr (std::is_same_v<T, std::string>) {
            arr.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, vec[i]));
        } else if constexpr (std::is_same_v<T, bool>) {
            arr.setValueAtIndex(rt, i, jsi::Value(vec[i]));
        } else {
            arr.setValueAtIndex(rt, i, jsi::Value(static_cast<double>(vec[i])));
        }
    }
    return arr;
}

} // namespace rnexecutorch::core::conversions
