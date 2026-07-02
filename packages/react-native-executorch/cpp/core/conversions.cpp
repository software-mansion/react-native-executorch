#include "conversions.h"
#include <cmath>
#include <limits>

namespace rnexecutorch::core::conversions {

constexpr double kMaxInt64Double = static_cast<double>(std::numeric_limits<int64_t>::max());
constexpr double kMinInt64Double = static_cast<double>(std::numeric_limits<int64_t>::min());
constexpr double kMaxUint64Double = static_cast<double>(std::numeric_limits<uint64_t>::max());

constexpr double kMinInt32Double = static_cast<double>(std::numeric_limits<int32_t>::min());
constexpr double kMaxInt32Double = static_cast<double>(std::numeric_limits<int32_t>::max());

constexpr double kMinUint8Double = static_cast<double>(std::numeric_limits<uint8_t>::min());
constexpr double kMaxUint8Double = static_cast<double>(std::numeric_limits<uint8_t>::max());

template <>
double asType<double>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isNumber()) {
        throw jsi::JSError(rt, ctx + " must be a number");
    }
    return val.asNumber();
}

template <>
float asType<float>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    return static_cast<float>(asType<double>(rt, ctx, val));
}

template <>
int32_t asType<int32_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    double v = asType<double>(rt, ctx, val);
    if (std::isnan(v) || std::isinf(v) || v != std::trunc(v) || v < kMinInt32Double || v > kMaxInt32Double) {
        throw jsi::JSError(rt, ctx + " must be a 32-bit integer");
    }
    return static_cast<int32_t>(v);
}

template <>
int64_t asType<int64_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    double v = asType<double>(rt, ctx, val);
    if (std::isnan(v) || std::isinf(v) || v != std::trunc(v) || v < kMinInt64Double || v >= kMaxInt64Double) {
        throw jsi::JSError(rt, ctx + " must be a 64-bit integer");
    }
    return static_cast<int64_t>(v);
}

template <>
uint64_t asType<uint64_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    double v = asType<double>(rt, ctx, val);
    if (std::isnan(v) || std::isinf(v) || v != std::trunc(v) || v < 0.0 || v >= kMaxUint64Double) {
        throw jsi::JSError(rt, ctx + " must be a non-negative integer");
    }
    return static_cast<uint64_t>(v);
}

template <>
uint8_t asType<uint8_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    double v = asType<double>(rt, ctx, val);
    if (std::isnan(v) || std::isinf(v) || v != std::trunc(v) || v < kMinUint8Double || v > kMaxUint8Double) {
        throw jsi::JSError(rt, ctx + " must be an integer between 0 and 255");
    }
    return static_cast<uint8_t>(v);
}

template <>
bool asType<bool>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isBool()) {
        throw jsi::JSError(rt, ctx + " must be a boolean");
    }
    return val.asBool();
}

template <>
std::string asType<std::string>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isString()) {
        throw jsi::JSError(rt, ctx + " must be a string");
    }
    return val.asString(rt).utf8(rt);
}

template <>
jsi::Value asType<jsi::Value>(jsi::Runtime &rt, const std::string & /*ctx*/, const jsi::Value &val) {
    return jsi::Value(rt, val);
}

template <>
jsi::ArrayBuffer asType<jsi::ArrayBuffer>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isObject() || !val.asObject(rt).isArrayBuffer(rt)) {
        throw jsi::JSError(rt, ctx + " must be an ArrayBuffer");
    }
    return val.asObject(rt).getArrayBuffer(rt);
}

template <>
jsi::Object asType<jsi::Object>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isObject()) {
        throw jsi::JSError(rt, ctx + " must be an object");
    }
    return val.asObject(rt);
}

template <>
jsi::Array asType<jsi::Array>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isObject() || !val.asObject(rt).isArray(rt)) {
        throw jsi::JSError(rt, ctx + " must be an Array");
    }
    return val.asObject(rt).asArray(rt);
}

template <>
jsi::Function asType<jsi::Function>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    if (!val.isObject() || !val.asObject(rt).isFunction(rt)) {
        throw jsi::JSError(rt, ctx + " must be a function");
    }
    return val.asObject(rt).asFunction(rt);
}

} // namespace rnexecutorch::core::conversions
