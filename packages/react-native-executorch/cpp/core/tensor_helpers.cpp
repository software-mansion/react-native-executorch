#include "tensor_helpers.h"

#include <algorithm>
#include <cstdint>
#include <format>
#include <jsi/jsi.h>
#include <string>
#include <unordered_map>
#include <variant>

#include "core/schema.h"
#include "dtype.h"

namespace rnexecutorch::core::tensor {
namespace types = rnexecutorch::core::types;
namespace conversions = rnexecutorch::core::conversions;

std::shared_lock<std::shared_mutex>
tryLockShared(jsi::Runtime &rt, const std::string &ctx, const std::shared_ptr<TensorHostObject> &tensor) {
    std::shared_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw jsi::JSError(rt, std::format("{} tensor is currently in use", ctx));
    }
    if (!tensor->data_) {
        throw jsi::JSError(rt, std::format("{} tensor has been disposed", ctx));
    }
    return lock;
}

std::unique_lock<std::shared_mutex>
tryLockUnique(jsi::Runtime &rt, const std::string &ctx, const std::shared_ptr<TensorHostObject> &tensor) {
    std::unique_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw jsi::JSError(rt, std::format("{} tensor is currently in use", ctx));
    }
    if (!tensor->data_) {
        throw jsi::JSError(rt, std::format("{} tensor has been disposed", ctx));
    }
    return lock;
}

void checkNotSameTensor(jsi::Runtime &rt,
                        const std::string &ctx1, const std::shared_ptr<TensorHostObject> &t1,
                        const std::string &ctx2, const std::shared_ptr<TensorHostObject> &t2) {
    if (t1 == t2) {
        throw jsi::JSError(rt, std::format("{} and {} cannot be the same tensor", ctx1, ctx2));
    }
}

namespace {
std::string shapeToString(const SymbolicShape &shape) {
    std::string s;
    for (const auto &dim : shape) {
        if (std::holds_alternative<std::string>(dim)) {
            s += std::get<std::string>(dim);
        }
        if (std::holds_alternative<int32_t>(dim)) {
            s += std::to_string(std::get<int32_t>(dim));
        }
        if (std::holds_alternative<schema::RangeDim>(dim)) {
            auto range = std::get<schema::RangeDim>(dim);
            s += std::format("[{}..{}:{}]", range.min, range.max, range.step);
        }
        if (std::holds_alternative<schema::EnumDim>(dim)) {
            auto enumeration = std::get<schema::EnumDim>(dim);
            s += "{";
            for (const auto choice : enumeration.choices) {
                s += std::to_string(choice) + ",";
            }
            if (!enumeration.choices.empty()) {
                s.pop_back();
            }
            s += "}";
        }
        s += ",";
    }
    if (!shape.empty()) {
        s.pop_back();
    }
    return "[" + s + "]";
}
} // namespace

std::shared_ptr<TensorHostObject>
fromJs(jsi::Runtime &rt, const std::string &ctx, const jsi::Value &value,
       std::optional<DType> expectedDtype, const std::optional<SymbolicShape> &expectedShape) {

    auto obj = conversions::asType<jsi::Object>(rt, ctx, value);
    if (!obj.isHostObject<TensorHostObject>(rt)) {
        throw jsi::JSError(rt, ctx + " must be a Tensor");
    }

    auto tensor = obj.getHostObject<TensorHostObject>(rt);
    const auto &dtype = tensor->dtype_;
    const auto &shape = tensor->shape_;

    if (expectedDtype && dtype != *expectedDtype) {
        throw jsi::JSError(rt, std::format("{} must be of type {}", ctx, types::toString(*expectedDtype)));
    }

    if (!expectedShape) {
        return tensor;
    }

    if (shape.size() != expectedShape->size()) {
        throw jsi::JSError(rt, std::format("{} must have shape {} (expected {} dimensions, got {})",
                                           ctx, shapeToString(*expectedShape), expectedShape->size(), shape.size()));
    }

    std::unordered_map<std::string, int32_t> symbolBinding;

    for (size_t i = 0; i < expectedShape->size(); ++i) {
        const auto &dim = expectedShape->at(i);

        if (std::holds_alternative<std::string>(dim)) {
            const auto &symbol = std::get<std::string>(dim);
            if (symbolBinding.contains(symbol) && symbolBinding[symbol] != shape[i]) {
                throw jsi::JSError(rt, "");
            }
            symbolBinding[symbol] = shape[i];
        }
        if (std::holds_alternative<int32_t>(dim)) {
            if (shape[i] != std::get<int32_t>(dim)) {
                throw jsi::JSError(rt, "");
            }
        }
        if (std::holds_alternative<schema::RangeDim>(dim)) {
            auto range = std::get<schema::RangeDim>(dim);
            if (shape[i] < range.min) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} out of range: {} < min {})",
                                                   ctx, shapeToString(*expectedShape), i, shape[i], range.min));
            }
            if (shape[i] > range.max) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} out of range: {} > max {})",
                                                   ctx, shapeToString(*expectedShape), i, shape[i], range.max));
            }
            if ((shape[i] - range.min) % range.step != 0) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} must be min({}) + k*step({}), got {})",
                                                   ctx, shapeToString(*expectedShape), i, range.min, range.step, shape[i]));
            }
        }
        if (std::holds_alternative<schema::EnumDim>(dim)) {
            auto enumeration = std::get<schema::EnumDim>(dim);
            if (std::ranges::find(enumeration.choices, shape[i]) == enumeration.choices.end()) {
                throw jsi::JSError(rt, std::format("{} must have shape {} (dim {} not allowed: got {})",
                                                   ctx, shapeToString(*expectedShape), i, shape[i]));
            }
        }
    }

    return tensor;
}
} // namespace rnexecutorch::core::tensor
