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

/**
 * Converts a facebook::jsi::Value to a specified target C++ or JSI type. Throws
 * a facebook::jsi::JSError with contextual error info if the conversion fails.
 *
 * @tparam T The target type to convert to.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used to generate helpful error messages.
 * @param val The JSI value to convert.
 * @return The converted value of type T.
 */
template <typename T>
T asType(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) = delete;

// NOLINTNEXTLINE(cppcoreguidelines-macro-usage): macro is used for succinct template specialization declarations
#define DECLARE_ASTYPE_SPECIALIZATION(Type) \
    template <>                             \
    Type asType<Type>(jsi::Runtime & rt, const std::string &ctx, const jsi::Value &val)
DECLARE_ASTYPE_SPECIALIZATION(double);
DECLARE_ASTYPE_SPECIALIZATION(float);
DECLARE_ASTYPE_SPECIALIZATION(int32_t);
DECLARE_ASTYPE_SPECIALIZATION(int64_t);
DECLARE_ASTYPE_SPECIALIZATION(uint64_t);
DECLARE_ASTYPE_SPECIALIZATION(uint8_t);
DECLARE_ASTYPE_SPECIALIZATION(bool);
DECLARE_ASTYPE_SPECIALIZATION(std::string);
DECLARE_ASTYPE_SPECIALIZATION(jsi::Value);
DECLARE_ASTYPE_SPECIALIZATION(jsi::Object);
DECLARE_ASTYPE_SPECIALIZATION(jsi::Array);
DECLARE_ASTYPE_SPECIALIZATION(jsi::Function);
DECLARE_ASTYPE_SPECIALIZATION(jsi::ArrayBuffer);
#undef DECLARE_ASTYPE_SPECIALIZATION

/**
 * Retrieves a required property from a JSI object, converting it to the
 * specified type. Throws a facebook::jsi::JSError if the property is missing or
 * of an incorrect type.
 *
 * @tparam T The target type to convert the property to.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used for error messages.
 * @param obj The JSI object containing the property.
 * @param propName The name of the property to retrieve.
 * @return The converted property value.
 */
template <typename T>
T getRequiredProperty(jsi::Runtime &rt, const std::string &ctx, const jsi::Object &obj, const std::string &propName) {
    if (!obj.hasProperty(rt, propName.c_str())) {
        throw jsi::JSError(rt, std::format("{}: option '{}' is required", ctx, propName));
    }
    return asType<T>(rt, std::format("{}: option '{}'", ctx, propName), obj.getProperty(rt, propName.c_str()));
}

/**
 * Retrieves an optional property from a JSI object, returning std::nullopt if
 * the property is missing, null, or undefined. Throws a facebook::jsi::JSError
 * if the property exists but cannot be converted to the target type.
 *
 * @tparam T The target type to convert the property to if present.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used for error messages.
 * @param obj The JSI object containing the property.
 * @param propName The name of the property to retrieve.
 * @return An optional containing the converted property value, or std::nullopt.
 */
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

/**
 * Converts a JSI Array to a std::vector of the specified type. Converts each
 * element of the array individually and propagates index details in the error
 * context.
 *
 * @tparam T The target element type.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used for error messages.
 * @param val The JSI value (must be an Array).
 * @return A std::vector containing the converted elements.
 */
template <typename T>
std::vector<T> asVector(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    auto arr = asType<jsi::Array>(rt, ctx, val);
    std::vector<T> vec;
    const size_t len = arr.size(rt);
    vec.reserve(len);
    for (size_t i = 0; i < len; ++i) {
        vec.push_back(asType<T>(rt, std::format("{}[{}]", ctx, i), arr.getValueAtIndex(rt, i)));
    }
    return vec;
}

/**
 * Converts a std::vector of values to a new facebook::jsi::Array.
 * Handles strings, booleans, and numeric types appropriately.
 *
 * @tparam T The element type in the vector.
 * @param rt The JSI runtime instance.
 * @param vec The source vector to convert.
 * @return A new facebook::jsi::Array containing the elements from the vector.
 */
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
