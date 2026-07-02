#include "tensor_helpers.h"
#include "dtype.h"

#include <format>
#include <unordered_map>

namespace rnexecutorch::core::tensor {
namespace types = rnexecutorch::core::types;

std::shared_lock<std::shared_mutex>
tryLockShared(jsi::Runtime &rt, const std::string &name, const std::shared_ptr<TensorHostObject> &tensor) {
    std::shared_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw jsi::JSError(rt, std::format("{} tensor is currently in use", name));
    }
    if (!tensor->data_) {
        throw jsi::JSError(rt, std::format("{} tensor has been disposed", name));
    }
    return lock;
}

std::unique_lock<std::shared_mutex>
tryLockUnique(jsi::Runtime &rt, const std::string &name, const std::shared_ptr<TensorHostObject> &tensor) {
    std::unique_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw jsi::JSError(rt, std::format("{} tensor is currently in use", name));
    }
    if (!tensor->data_) {
        throw jsi::JSError(rt, std::format("{} tensor has been disposed", name));
    }
    return lock;
}

void checkNotSameTensor(jsi::Runtime &rt,
                        const std::string &name1, const std::shared_ptr<TensorHostObject> &t1,
                        const std::string &name2, const std::shared_ptr<TensorHostObject> &t2) {
    if (t1 == t2) {
        throw jsi::JSError(rt, std::format("{} and {} cannot be the same tensor", name1, name2));
    }
}

namespace {

std::string shapeToString(const SymbolicShape &shape) {
    std::string s;
    for (size_t i = 0; i < shape.size(); ++i) {
        if (i > 0) {
            s += ", ";
        }
        const auto &dim = shape.at(i);
        if (std::holds_alternative<int32_t>(dim)) {
            s += std::format("{}", std::get<int32_t>(dim));
        } else if (std::holds_alternative<std::string>(dim)) {
            s += std::get<std::string>(dim);
        } else {
            const auto &rangeDim = std::get<RangeDim>(dim);
            s += std::format("[{}..{}{}]",
                             rangeDim.min,
                             rangeDim.max,
                             rangeDim.step ? std::format(" step {}", *rangeDim.step) : "");
        }
    }
    return std::format("[{}]", s);
}

} // namespace

std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &name, const jsi::Value &value,
       std::optional<DType> expectedDtype, const std::optional<SymbolicShape> &expectedShape) {

    if (!value.isObject() || !value.asObject(rt).isHostObject<TensorHostObject>(rt)) {
        throw jsi::JSError(rt, name + " must be a Tensor");
    }

    auto tensor = value.asObject(rt).getHostObject<TensorHostObject>(rt);
    const auto &dtype = tensor->dtype_;
    const auto &shape = tensor->shape_;

    if (expectedDtype && dtype != *expectedDtype) {
        throw jsi::JSError(rt, std::format("{} must be of type {}", name, types::toString(*expectedDtype)));
    }

    if (!expectedShape) {
        return tensor;
    }

    if (shape.size() != expectedShape->size()) {
        throw jsi::JSError(rt, std::format("{} must have shape {} (expected {} dimensions, got {})",
                                           name, shapeToString(*expectedShape), expectedShape->size(), shape.size()));
    }

    std::unordered_map<std::string, int32_t> symbolToConcrete;

    for (size_t i = 0; i < expectedShape->size(); ++i) {
        const auto &dim = expectedShape->at(i);

        if (std::holds_alternative<int32_t>(dim)) {
            const auto expected = std::get<int32_t>(dim);
            if (shape[i] != expected) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} mismatch: expected {}, got {})",
                                                   name, shapeToString(*expectedShape), i, expected, shape[i]));
            }
        } else if (std::holds_alternative<std::string>(dim)) {
            const auto &symbol = std::get<std::string>(dim);
            if (symbolToConcrete.contains(symbol) && shape[i] != symbolToConcrete[symbol]) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} mismatch: expected {}, got {})",
                                                   name, shapeToString(*expectedShape), i, symbolToConcrete[symbol], shape[i]));
            }
            symbolToConcrete[symbol] = shape[i];
        } else {
            const auto &rangeDim = std::get<RangeDim>(dim);
            if (shape[i] < rangeDim.min) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} out of range: {} < min {})",
                                                   name, shapeToString(*expectedShape), i, shape[i], rangeDim.min));
            }
            if (shape[i] > rangeDim.max) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} out of range: {} > max {})",
                                                   name, shapeToString(*expectedShape), i, shape[i], rangeDim.max));
            }
            if (rangeDim.step && (shape[i] - rangeDim.min) % *rangeDim.step != 0) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} must be min({}) + k*step({}), got {})",
                                                   name, shapeToString(*expectedShape), i, rangeDim.min, *rangeDim.step, shape[i]));
            }
        }
    }

    return tensor;
}
} // namespace rnexecutorch::core::tensor
