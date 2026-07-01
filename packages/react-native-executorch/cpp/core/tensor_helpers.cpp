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
    if (t1.get() == t2.get()) {
        throw jsi::JSError(rt, std::format("{} and {} cannot be the same tensor", name1, name2));
    }
}

std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &name, const jsi::Value &value,
       std::optional<DType> expectedDtype, const std::optional<SymbolicShape> &expectedShape) {

    if (!value.isObject() || !value.asObject(rt).isHostObject<TensorHostObject>(rt)) {
        throw jsi::JSError(rt, name + " must be a Tensor");
    }

    auto tensor = value.asObject(rt).getHostObject<TensorHostObject>(rt);
    auto dtype = tensor->dtype_;
    auto shape = tensor->shape_;

    if (expectedDtype && dtype != *expectedDtype) {
        throw jsi::JSError(rt, std::format("{} must be of type {}",
                                           name, types::toString(*expectedDtype)));
    }

    if (expectedShape) {
        std::string shapeStr = "[";
        for (size_t i = 0; i < expectedShape->size(); ++i) {
            if (i > 0) {
                shapeStr += ", ";
            }
            const auto &dim = expectedShape->at(i);
            if (std::holds_alternative<int32_t>(dim)) {
                shapeStr += std::to_string(std::get<int32_t>(dim));
            } else {
                shapeStr += std::get<std::string>(dim);
            }
        }
        shapeStr += "]";

        if (shape.size() != expectedShape->size()) {
            throw jsi::JSError(rt, std::format("{} must have shape {} (expected {} dimensions, got {})",
                                               name, shapeStr, expectedShape->size(), shape.size()));
        }

        std::unordered_map<std::string, int32_t> symbolMap;
        for (size_t i = 0; i < expectedShape->size(); ++i) {
            const auto &dim = expectedShape->at(i);
            if (std::holds_alternative<int32_t>(dim)) {
                if (shape[i] != std::get<int32_t>(dim)) {
                    throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} mismatch: expected {}, got {})",
                                                       name, shapeStr, i, std::get<int32_t>(dim), shape[i]));
                }
            } else {
                const auto &symbol = std::get<std::string>(dim);
                if (symbolMap.contains(symbol) && shape[i] != symbolMap[symbol]) {
                    throw jsi::JSError(rt, std::format("{} must have shape {} (dim '{}' mismatch: expected {}, got {})",
                                                       name, shapeStr, i, symbolMap[symbol], shape[i]));
                }
                symbolMap[symbol] = shape[i];
            }
        }
    }
    return tensor;
}
} // namespace rnexecutorch::core::tensor
