#pragma once

#include <cstdint>
#include <memory>
#include <mutex>
#include <optional>
#include <shared_mutex>
#include <string>
#include <vector>

#include <jsi/jsi.h>

#include "conversions.h"
#include "dtype.h"
#include "tensor.h"

namespace rnexecutorch::core::tensor {
namespace jsi = facebook::jsi;

using rnexecutorch::core::types::DType;
using SymbolicShape = std::vector<std::variant<int32_t, std::string>>;

[[nodiscard]] std::shared_lock<std::shared_mutex>
tryLockShared(jsi::Runtime &rt, const std::string &name, const std::shared_ptr<TensorHostObject> &tensor);

[[nodiscard]] std::unique_lock<std::shared_mutex>
tryLockUnique(jsi::Runtime &rt, const std::string &name, const std::shared_ptr<TensorHostObject> &tensor);

void checkNotSameTensor(jsi::Runtime &rt,
                        const std::string &name1, const std::shared_ptr<TensorHostObject> &t1,
                        const std::string &name2, const std::shared_ptr<TensorHostObject> &t2);

std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &name, const jsi::Value &value,
       std::optional<DType> expectedDtype, const std::optional<SymbolicShape> &expectedShape);

inline std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &name, const jsi::Value &value,
       std::optional<DType> expectedDtype, const std::vector<int32_t> &expectedShape) {
    SymbolicShape convertedShape(expectedShape.begin(), expectedShape.end());
    return fromJs(rt, name, value, expectedDtype, std::move(convertedShape));
}
} // namespace rnexecutorch::core::tensor
