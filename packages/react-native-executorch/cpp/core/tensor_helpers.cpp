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

#include "core/error.h"

namespace rnexecutorch::core::tensor {
namespace types = rnexecutorch::core::types;
namespace conversions = rnexecutorch::core::conversions;

std::shared_lock<std::shared_mutex>
tryLockShared(jsi::Runtime & /*rt*/, const std::string &ctx, const std::shared_ptr<TensorHostObject> &tensor) {
    std::shared_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw error::ResourceBusy(std::format("{} tensor is currently in use", ctx));
    }
    if (!tensor->data_) {
        throw error::ResourceDisposed(std::format("{} tensor has been disposed", ctx));
    }
    return lock;
}

std::unique_lock<std::shared_mutex>
tryLockUnique(jsi::Runtime & /*rt*/, const std::string &ctx, const std::shared_ptr<TensorHostObject> &tensor) {
    std::unique_lock<std::shared_mutex> lock(tensor->mutex_, std::try_to_lock);
    if (!lock.owns_lock()) {
        throw error::ResourceBusy(std::format("{} tensor is currently in use", ctx));
    }
    if (!tensor->data_) {
        throw error::ResourceDisposed(std::format("{} tensor has been disposed", ctx));
    }
    return lock;
}

void checkNotSameTensor(jsi::Runtime & /*rt*/,
                        const std::string &ctx1, const std::shared_ptr<TensorHostObject> &t1,
                        const std::string &ctx2, const std::shared_ptr<TensorHostObject> &t2) {
    if (t1 == t2) {
        throw error::InvalidArgument(std::format("{} and {} cannot be the same tensor", ctx1, ctx2));
    }
}

namespace {

template <class... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};

std::string shapeToString(const SymbolicShape &shape) {
    std::string s;
    for (const auto &dim : shape) {
        // clang-format off
        std::visit(overloaded{
            [&](const std::string &str) { s += str; },
            [&](int32_t val) { s += std::to_string(val); },
            [&](const schema::RangeDim &range) {
                s += std::format("[{}..{}:{}]", range.min, range.max, range.step);
            },
            [&](const schema::EnumDim &enumeration) {
                s += "{";
                for (const auto choice : enumeration.choices) {
                    s += std::to_string(choice) + ",";
                }
                if (!enumeration.choices.empty()) {
                    s.pop_back();
                }
                s += "}";
            },
        }, dim);
        // clang-format on
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
        throw error::InvalidArgument(ctx + " must be a Tensor");
    }

    auto tensor = obj.getHostObject<TensorHostObject>(rt);
    const auto &dtype = tensor->dtype_;
    const auto &shape = tensor->shape_;

    if (expectedDtype && dtype != *expectedDtype) {
        throw error::InvalidArgument(std::format("{} must be of type {} (got {})",
                                                 ctx, types::dtypeToString(*expectedDtype), types::dtypeToString(dtype)));
    }

    if (!expectedShape) {
        return tensor;
    }

    if (shape.size() != expectedShape->size()) {
        throw error::InvalidArgument(std::format("{} must have shape {} (expected {} dimensions, got {})",
                                                 ctx, shapeToString(*expectedShape), expectedShape->size(), shape.size()));
    }

    std::unordered_map<std::string, int32_t> symbolBinding;

    for (size_t i = 0; i < expectedShape->size(); ++i) {
        const auto &dim = expectedShape->at(i);

        // clang-format off
        std::visit(overloaded{
            [&](const std::string &symbol) {
                if (symbolBinding.contains(symbol) && symbolBinding[symbol] != shape[i]) {
                    throw error::InvalidArgument(std::format("{} must have shape {} (symbol {} mismatch: expected {}, got {})",
                                                             ctx, shapeToString(*expectedShape), symbol, symbolBinding[symbol], shape[i]));
                }
                symbolBinding[symbol] = shape[i];
            },
            [&](int32_t val) {
                if (shape[i] != val) {
                    throw error::InvalidArgument(std::format("{} must have shape {} (dim {} mismatch: expected {}, got {})",
                                                             ctx, shapeToString(*expectedShape), i, val, shape[i]));
                }
            },
            [&](const schema::RangeDim &range) {
                if (shape[i] < range.min) {
                    throw error::InvalidArgument(std::format("{} must have shape {} (dim {} out of range: {} < min {})",
                                                             ctx, shapeToString(*expectedShape), i, shape[i], range.min));
                }
                if (shape[i] > range.max) {
                    throw error::InvalidArgument(std::format("{} must have shape {} (dim {} out of range: {} > max {})",
                                                             ctx, shapeToString(*expectedShape), i, shape[i], range.max));
                }
                if ((shape[i] - range.min) % range.step != 0) {
                    throw error::InvalidArgument(std::format("{} must have shape {} (dim {} must be min({}) + k*step({}), got {})",
                                                             ctx, shapeToString(*expectedShape), i, range.min, range.step, shape[i]));
                }
            },
            [&](const schema::EnumDim &enumeration) {
                if (std::ranges::find(enumeration.choices, shape[i]) == enumeration.choices.end()) {
                    throw error::InvalidArgument(std::format("{} must have shape {} (dim {} not allowed: got {})",
                                                             ctx, shapeToString(*expectedShape), i, shape[i]));
                }
            },
        }, dim);
        // clang-format on
    }

    return tensor;
}
} // namespace rnexecutorch::core::tensor
