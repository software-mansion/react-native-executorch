#include "conversions.h"
#include <cmath>

namespace rnexecutorch::core::conversions {

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
    return static_cast<int32_t>(asType<double>(rt, ctx, val));
}

template <>
int64_t asType<int64_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    return static_cast<int64_t>(asType<double>(rt, ctx, val));
}

template <>
uint64_t asType<uint64_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    double v = asType<double>(rt, ctx, val);
    if (std::isnan(v) || v < 0.0) {
        throw jsi::JSError(rt, ctx + " must be a non-negative integer");
    }
    return static_cast<uint64_t>(v);
}

template <>
uint8_t asType<uint8_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    double v = asType<double>(rt, ctx, val);
    if (std::isnan(v) || v < 0.0 || v > 255.0) {
        throw jsi::JSError(rt, ctx + " must be between 0 and 255");
    }
    return static_cast<uint8_t>(v);
}

template <>
size_t asType<size_t>(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    double v = asType<double>(rt, ctx, val);
    if (std::isnan(v) || v < 0.0) {
        throw jsi::JSError(rt, ctx + " must be a non-negative integer");
    }
    return static_cast<size_t>(v);
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
} // namespace rnexecutorch::core::conversions
