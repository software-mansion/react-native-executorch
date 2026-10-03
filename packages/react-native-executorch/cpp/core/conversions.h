#pragma once

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <format>
#include <optional>
#include <string>
#include <type_traits>
#include <vector>

#include "core/error.h"
#include <jsi/jsi.h>

namespace rnexecutorch::core::conversions {
namespace jsi = facebook::jsi;

/**
 * Converts a facebook::jsi::Value to a specified target C++ or JSI type.
 *
 * @tparam T The target type to convert to.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used to generate helpful error messages.
 * @param val The JSI value to convert.
 * @return The converted value of type T.
 * @throws error::RnExecuTorchException with code InvalidArgument, carrying
 * `ctx`, if the value is not convertible to T.
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
 * specified type.
 *
 * @tparam T The target type to convert the property to.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used for error messages.
 * @param obj The JSI object containing the property.
 * @param propName The name of the property to retrieve.
 * @return The converted property value.
 * @throws error::RnExecuTorchException with code InvalidArgument if the
 * property is missing or of an incorrect type.
 */
template <typename T>
T getRequiredProperty(jsi::Runtime &rt, const std::string &ctx, const jsi::Object &obj, const std::string &propName) {
    if (!obj.hasProperty(rt, propName.c_str())) {
        throw error::InvalidArgument(std::format("{}: option '{}' is required", ctx, propName));
    }
    return asType<T>(rt, std::format("{}: option '{}'", ctx, propName), obj.getProperty(rt, propName.c_str()));
}

/**
 * Retrieves an optional property from a JSI object, returning std::nullopt if
 * the property is missing, null, or undefined.
 *
 * @tparam T The target type to convert the property to if present.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used for error messages.
 * @param obj The JSI object containing the property.
 * @param propName The name of the property to retrieve.
 * @return An optional containing the converted property value, or std::nullopt.
 * @throws error::RnExecuTorchException with code InvalidArgument if the
 * property is present but cannot be converted to the target type.
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
 * @throws error::RnExecuTorchException with code InvalidArgument if the value
 * is not an Array or if any element fails to convert.
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
 * Reads a JS TypedArray into a std::vector<T> by copying its backing
 * ArrayBuffer in a single memcpy. Unlike asVector, elements are not boxed
 * through JSI one by one. The bytes are interpreted as-is, so T must match the
 * TypedArray's element type (e.g. int32_t for an Int32Array); if the caller
 * needs a different element type it should reinterpret the result explicitly,
 * e.g. std::vector<uint64_t>(v.begin(), v.end()).
 *
 * @tparam T The element type; the buffer's bytes are read directly as T.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used for error messages.
 * @param val The JSI value (must be a TypedArray / have a `buffer`).
 * @return A std::vector containing the elements.
 * @throws error::RnExecuTorchException with code InvalidArgument if the value
 * is not a TypedArray, if the view lies outside its ArrayBuffer, or if its
 * byte length is not a multiple of sizeof(T).
 */
template <typename T>
std::vector<T> fromJsiTypedArray(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    static_assert(std::is_arithmetic_v<T>, "fromJsiTypedArray requires an arithmetic type");

    auto obj = asType<jsi::Object>(rt, ctx, val);
    auto buffer = getRequiredProperty<jsi::ArrayBuffer>(rt, ctx, obj, "buffer");

    const size_t byteOffset = getOptionalProperty<uint64_t>(rt, ctx, obj, "byteOffset").value_or(0);
    const size_t byteLength = getOptionalProperty<uint64_t>(rt, ctx, obj, "byteLength").value_or(buffer.size(rt));

    if (byteOffset > buffer.size(rt) || byteLength > buffer.size(rt) - byteOffset) {
        throw error::InvalidArgument(std::format("{}: out-of-bounds byteOffset ({}) or byteLength ({}) for ArrayBuffer of size {}",
                                                 ctx, byteOffset, byteLength, buffer.size(rt)));
    }
    if (byteLength % sizeof(T) != 0) {
        throw error::InvalidArgument(std::format("{}: byteLength is not a multiple of sizeof(T)={}", ctx, sizeof(T)));
    }

    std::vector<T> vec(byteLength / sizeof(T));
    std::memcpy(vec.data(), buffer.data(rt) + byteOffset, byteLength);
    return vec;
}

/** Helper constant for static_assert in dependent template contexts. */
template <typename>
inline constexpr bool kAlwaysFalse = false;

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
            arr.setValueAtIndex(rt, i, jsi::Value(static_cast<bool>(vec[i])));
        } else if constexpr (std::is_arithmetic_v<T>) {
            arr.setValueAtIndex(rt, i, jsi::Value(static_cast<double>(vec[i])));
        } else {
            static_assert(kAlwaysFalse<T>, "Unsupported vector element type for toJsiArray");
        }
    }
    return arr;
}

/**
 * Maps an arithmetic C++ type to the name of the JS TypedArray constructor whose
 * elements have the same layout (e.g. int32_t -> "Int32Array"). 64-bit integers
 * are intentionally unsupported: their JS counterparts (BigInt64Array) hold
 * bigints rather than numbers.
 */
template <typename Storage>
constexpr const char *jsiTypedArrayName() {
    if constexpr (std::is_same_v<Storage, int8_t>) {
        return "Int8Array";
    } else if constexpr (std::is_same_v<Storage, uint8_t>) {
        return "Uint8Array";
    } else if constexpr (std::is_same_v<Storage, int16_t>) {
        return "Int16Array";
    } else if constexpr (std::is_same_v<Storage, uint16_t>) {
        return "Uint16Array";
    } else if constexpr (std::is_same_v<Storage, int32_t>) {
        return "Int32Array";
    } else if constexpr (std::is_same_v<Storage, uint32_t>) {
        return "Uint32Array";
    } else if constexpr (std::is_same_v<Storage, float>) {
        return "Float32Array";
    } else if constexpr (std::is_same_v<Storage, double>) {
        return "Float64Array";
    } else {
        static_assert(kAlwaysFalse<Storage>, "Unsupported TypedArray element type");
    }
}

/**
 * Converts a std::vector<T> to a JS TypedArray backed by an ArrayBuffer. This
 * is far cheaper to move across worklet runtime boundaries than toJsiArray:
 * react-native-worklets clones the underlying ArrayBuffer with a single memcpy
 * instead of serializing each element individually, which matters for long
 * sequences (e.g. token ids). Read it back with fromJsiTypedArray.
 *
 * @tparam T The vector element type, which also selects the JS view
 * (e.g. int32_t -> Int32Array).
 * @param rt The JSI runtime instance.
 * @param vec The source vector to convert.
 * @return A new JS TypedArray containing the elements from the vector.
 */
template <typename T>
jsi::Object toJsiTypedArray(jsi::Runtime &rt, const std::vector<T> &vec) {
    static_assert(std::is_arithmetic_v<T>, "toJsiTypedArray requires an arithmetic type");
    const size_t byteLength = vec.size() * sizeof(T);
    auto arrayBuffer = rt.global()
                           .getPropertyAsFunction(rt, "ArrayBuffer")
                           .callAsConstructor(rt, static_cast<double>(byteLength))
                           .asObject(rt);

    if (!vec.empty()) {
        std::memcpy(arrayBuffer.getArrayBuffer(rt).data(rt), vec.data(), byteLength);
    }

    return rt.global()
        .getPropertyAsFunction(rt, jsiTypedArrayName<T>())
        .callAsConstructor(rt, arrayBuffer)
        .asObject(rt);
}

} // namespace rnexecutorch::core::conversions
