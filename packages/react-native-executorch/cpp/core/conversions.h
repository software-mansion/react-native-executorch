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
 * Reads a JS TypedArray into a std::vector by copying its backing ArrayBuffer
 * in a single pass. Unlike asVector, elements are not boxed through JSI one by
 * one. Pairs with toJsiTypedArray so that numeric arrays can cross worklet
 * runtime boundaries as a cheap ArrayBuffer clone rather than an element-by-
 * element serialization.
 *
 * @tparam Storage The element type of the TypedArray's storage (e.g. int32_t
 * for an Int32Array). Determines how the backing buffer bytes are interpreted.
 * @tparam T The target vector element type; each storage element is cast to it.
 * Defaults to Storage.
 * @param rt The JSI runtime instance.
 * @param ctx Context description used for error messages.
 * @param val The JSI value (must be a TypedArray whose element size is
 * sizeof(Storage)).
 * @return A std::vector containing the converted elements.
 */
template <typename Storage, typename T = Storage>
std::vector<T> fromJsiTypedArray(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &val) {
    static_assert(std::is_arithmetic_v<Storage>, "fromJsiTypedArray requires an arithmetic storage type");
    auto obj = asType<jsi::Object>(rt, ctx, val);
    if (!obj.hasProperty(rt, "buffer")) {
        throw jsi::JSError(rt, ctx + " must be a TypedArray");
    }
    if (getRequiredProperty<uint64_t>(rt, ctx, obj, "BYTES_PER_ELEMENT") != sizeof(Storage)) {
        throw jsi::JSError(rt, ctx + " has an unexpected element size");
    }
    auto buffer = asType<jsi::ArrayBuffer>(rt, ctx, obj.getProperty(rt, "buffer"));
    const auto byteOffset = static_cast<size_t>(getOptionalProperty<uint64_t>(rt, ctx, obj, "byteOffset").value_or(0));
    const auto length = static_cast<size_t>(getRequiredProperty<uint64_t>(rt, ctx, obj, "length"));
    if (byteOffset + length * sizeof(Storage) > buffer.size(rt)) {
        throw jsi::JSError(rt, ctx + " is out of bounds for its backing ArrayBuffer");
    }
    // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast): reading the typed array's raw storage
    const auto *src = reinterpret_cast<const Storage *>(buffer.data(rt) + byteOffset);
    std::vector<T> vec;
    vec.reserve(length);
    for (size_t i = 0; i < length; ++i) {
        vec.push_back(static_cast<T>(src[i]));
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

template <typename>
inline constexpr bool kAlwaysFalse = false;

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
 * Converts a std::vector to a JS TypedArray backed by an ArrayBuffer. This is
 * far cheaper to move across worklet runtime boundaries than toJsiArray:
 * react-native-worklets clones the underlying ArrayBuffer with a single memcpy
 * instead of serializing each element individually, which matters for long
 * sequences (e.g. token ids). Read it back with fromJsiTypedArray.
 *
 * @tparam Storage The element type of the resulting TypedArray's storage, which
 * also selects the JS view (e.g. int32_t -> Int32Array).
 * @tparam T The source vector element type; each value is cast to Storage.
 * Defaults to Storage.
 * @param rt The JSI runtime instance.
 * @param vec The source vector to convert.
 * @return A new JS TypedArray containing the elements from the vector.
 */
template <typename Storage, typename T = Storage>
jsi::Object toJsiTypedArray(jsi::Runtime &rt, const std::vector<T> &vec) {
    static_assert(std::is_arithmetic_v<Storage>, "toJsiTypedArray requires an arithmetic storage type");
    const size_t byteLength = vec.size() * sizeof(Storage);
    auto arrayBuffer = rt.global()
                           .getPropertyAsFunction(rt, "ArrayBuffer")
                           .callAsConstructor(rt, static_cast<double>(byteLength))
                           .asObject(rt);
    // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast): writing directly into the typed array's storage
    auto *dst = reinterpret_cast<Storage *>(arrayBuffer.getArrayBuffer(rt).data(rt));
    for (size_t i = 0; i < vec.size(); ++i) {
        dst[i] = static_cast<Storage>(vec[i]);
    }
    return rt.global()
        .getPropertyAsFunction(rt, jsiTypedArrayName<Storage>())
        .callAsConstructor(rt, arrayBuffer)
        .asObject(rt);
}

} // namespace rnexecutorch::core::conversions
