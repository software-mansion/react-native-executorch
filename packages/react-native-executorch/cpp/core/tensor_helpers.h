#pragma once

#include <concepts>
#include <cstdint>
#include <initializer_list>
#include <memory>
#include <mutex>
#include <optional>
#include <ranges>
#include <shared_mutex>
#include <string>
#include <variant>
#include <vector>

#include "conversions.h"
#include "dtype.h"
#include "schema.h"
#include "tensor.h"

#include <jsi/jsi.h>

namespace rnexecutorch::core::tensor {
namespace jsi = facebook::jsi;

using rnexecutorch::core::types::DType;
using schema::EnumDim;
using schema::RangeDim;

using SymbolicDim = std::variant<std::string, int32_t, RangeDim, EnumDim>;
using SymbolicShape = std::vector<SymbolicDim>;

/**
 * Tries to acquire a shared (read) lock on the underlying tensor resource.
 * Throws a facebook::jsi::JSError if the lock is currently held uniquely by
 * another thread or if the tensor has already been disposed.
 *
 * @param rt The JSI runtime instance.
 * @param name The name/context of the tensor for error messages.
 * @param tensor Shared pointer to the TensorHostObject.
 * @return A shared lock protecting the tensor data.
 */
[[nodiscard]] std::shared_lock<std::shared_mutex>
tryLockShared(jsi::Runtime &rt, const std::string &ctx, const std::shared_ptr<TensorHostObject> &tensor);

/**
 * Tries to acquire a unique (write) lock on the underlying tensor resource.
 * Throws a facebook::jsi::JSError if the lock is currently held by another
 * thread or if the tensor has already been disposed.
 *
 * @param rt The JSI runtime instance.
 * @param ctx The name/context of the tensor for error messages.
 * @param tensor Shared pointer to the TensorHostObject.
 * @return A unique lock protecting the tensor data.
 */
[[nodiscard]] std::unique_lock<std::shared_mutex>
tryLockUnique(jsi::Runtime &rt, const std::string &ctx, const std::shared_ptr<TensorHostObject> &tensor);

/**
 * Validates that two JSI Tensor parameters do not point to the exact same
 * underlying TensorHostObject instance, preventing mutation aliasing issues.
 * Throws a facebook::jsi::JSError if they are the same tensor.
 *
 * @param rt The JSI runtime instance.
 * @param ctx1 Context name of the first tensor.
 * @param t1 The first tensor.
 * @param ctx2 Context name of the second tensor.
 * @param t2 The second tensor.
 */
void checkNotSameTensor(jsi::Runtime &rt,
                        const std::string &ctx1, const std::shared_ptr<TensorHostObject> &t1,
                        const std::string &ctx2, const std::shared_ptr<TensorHostObject> &t2);

/**
 * Extracts, type-checks, and shape-validates a TensorHostObject from a JSI
 * Value parameter. Throws a facebook::jsi::JSError with precise details if type
 * checking or shape validation fails.
 *
 * @param rt The JSI runtime instance.
 * @param ctx Parameter name for contextual error messages.
 * @param value The JSI value to extract the Tensor from.
 * @param expectedDtype Optional expected DType constraint.
 * @param expectedShape Optional expected shape (SymbolicShape) constraint.
 * @return Shared pointer to the validated TensorHostObject.
 */
std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &value,
       std::optional<DType> expectedDtype, const std::optional<SymbolicShape> &expectedShape);

/**
 * @overload
 *
 * Convenience wrapper that accepts an initializer list of symbolic shape
 * elements. Allows passing shape constraints like `{"H", "W", 1}` directly
 * without typing SymbolicShape explicitly.
 */
inline std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &value,
       std::optional<DType> expectedDtype,
       std::initializer_list<SymbolicDim> expectedShape) {
    return fromJs(rt, ctx, value, expectedDtype, std::optional<SymbolicShape>(expectedShape));
}

/**
 * @overload
 *
 * Convenience wrapper that accepts any concrete C++ range as the expected shape
 * (e.g. std::vector<int32_t>).
 *
 * @tparam Range The type of the expected shape container.
 */
template <typename Range>
    requires std::ranges::input_range<Range> &&
             std::convertible_to<std::ranges::range_value_t<Range>, int32_t>
inline std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &value,
       std::optional<DType> expectedDtype, const Range &expectedShape) {
    SymbolicShape convertedShape(expectedShape.begin(), expectedShape.end());
    return fromJs(rt, ctx, value, expectedDtype, std::move(convertedShape));
}

/**
 * @overload
 *
 * Convenience wrapper that accepts a vector of ConcreteDim values as the
 * expected shape. Useful when building shapes programmatically from
 * ConcreteDim without manually wrapping each element in SymbolicDim.
 */
inline std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &value,
       std::optional<DType> expectedDtype, const std::vector<schema::ConcreteDim> &expectedShape) {
    SymbolicShape convertedShape;
    convertedShape.reserve(expectedShape.size());
    for (const auto &dim : expectedShape) {
        convertedShape.push_back(std::visit([](const auto &d) -> SymbolicDim { return d; }, dim));
    }
    return fromJs(rt, ctx, value, expectedDtype, std::move(convertedShape));
}

} // namespace rnexecutorch::core::tensor
