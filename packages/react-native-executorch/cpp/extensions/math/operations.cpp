#include "operations.h"

#include <algorithm>
#include <cmath>
#include <limits>
#include <optional>
#include <utility>

#include "core/tensor.h"
#include "core/tensor_helpers.h"

namespace rnexecutorch::extensions::math {
namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;

namespace tensor = rnexecutorch::core::tensor;
using rnexecutorch::core::types::DType;

void install_sigmoid(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "sigmoid";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: sigmoid(src, dst)");
        }

        auto src = tensor::fromJs(rt, "sigmoid: src", args[0], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "sigmoid: dst", args[1], DType::float32, src->shape_);

        tensor::checkNotSameTensor(rt, "sigmoid: src", src, "sigmoid: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "sigmoid: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "sigmoid: dst", dst);

        const auto countElements = src->numel_;
        const auto *srcData = reinterpret_cast<const float *>(src->data_.get());
        auto *dstData = reinterpret_cast<float *>(dst->data_.get());

        for (size_t i = 0; i < countElements; ++i) {
            dstData[i] = 1.0f / (1.0f + std::exp(-srcData[i]));
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

void install_softmax(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "softmax";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: softmax(src, dst, axis)");
        }

        auto src = tensor::fromJs(rt, "softmax: src", args[0], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "softmax: dst", args[1], DType::float32, src->shape_);

        tensor::checkNotSameTensor(rt, "softmax: src", src, "softmax: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "softmax: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "softmax: dst", dst);

        if (src->shape_.empty()) {
            throw jsi::JSError(rt, "softmax: src must have at least one dimension");
        }

        int axis = conversions::asType<int32_t>(rt, "softmax: axis", args[2]);
        const int rank = static_cast<int>(src->shape_.size());

        // Support negative axis indices like numpy (e.g., axis=-1 means last
        // axis, -2 means second to last, etc.)
        if (axis < 0) {
            axis += rank;
        }
        if (axis < 0 || axis >= rank) {
            throw jsi::JSError(rt, "softmax: axis is out of range");
        }
        const auto axisIdx = static_cast<size_t>(axis);

        const auto *srcData = reinterpret_cast<const float *>(src->data_.get());
        auto *dstData = reinterpret_cast<float *>(dst->data_.get());

        const auto axisDim = static_cast<size_t>(src->shape_[axisIdx]);
        if (axisDim == 0) {
            throw jsi::JSError(rt, "softmax: axis dimension must be greater than zero");
        }

        size_t outer = 1;
        for (size_t i = 0; std::cmp_less(i, axis); ++i) {
            outer *= static_cast<size_t>(src->shape_[i]);
        }

        size_t inner = 1;
        for (size_t i = axisIdx + 1; std::cmp_less(i, rank); ++i) {
            inner *= static_cast<size_t>(src->shape_[i]);
        }

        for (size_t outerIndex = 0; outerIndex < outer; ++outerIndex) {
            for (size_t innerIndex = 0; innerIndex < inner; ++innerIndex) {
                const size_t base = outerIndex * axisDim * inner + innerIndex;

                float maxValue = -std::numeric_limits<float>::infinity();
                for (size_t axisIndex = 0; axisIndex < axisDim; ++axisIndex) {
                    maxValue = std::max(maxValue, srcData[base + axisIndex * inner]);
                }

                float sum = 0.0f;
                for (size_t axisIndex = 0; axisIndex < axisDim; ++axisIndex) {
                    const float value = std::exp(srcData[base + axisIndex * inner] - maxValue);
                    dstData[base + axisIndex * inner] = value;
                    sum += value;
                }

                for (size_t axisIndex = 0; axisIndex < axisDim; ++axisIndex) {
                    dstData[base + axisIndex * inner] /= sum;
                }
            }
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_argmax(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "argmax";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: argmax(src, dst, axis)");
        }

        auto src = tensor::fromJs(rt, "argmax: src", args[0], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "argmax: dst", args[1], DType::int32, std::nullopt);

        tensor::checkNotSameTensor(rt, "argmax: src", src, "argmax: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "argmax: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "argmax: dst", dst);

        int axis = conversions::asType<int32_t>(rt, "argmax: axis", args[2]);
        const int rank = static_cast<int>(src->shape_.size());

        // Support negative axis indices like numpy (e.g., axis=-1 means last
        // axis, -2 means second to last, etc.)
        if (axis < 0) {
            axis += rank;
        }
        if (axis < 0 || axis >= rank) {
            throw jsi::JSError(rt, "argmax: axis is out of range");
        }
        const auto axisIdx = static_cast<size_t>(axis);

        auto dstExpectedShape = src->shape_;
        dstExpectedShape[axisIdx] = 1;
        if (dst->shape_ != dstExpectedShape) {
            throw jsi::JSError(rt, "argmax: dst shape must match src shape but with axis dimension 1");
        }

        const auto *srcData = reinterpret_cast<const float *>(src->data_.get());

        const auto axisDim = static_cast<size_t>(src->shape_[axisIdx]);
        if (axisDim == 0) {
            throw jsi::JSError(rt, "argmax: axis dimension must be greater than zero");
        }

        size_t outer = 1;
        size_t inner = 1;
        for (size_t i = 0; std::cmp_less(i, axis); ++i) {
            outer *= static_cast<size_t>(src->shape_[i]);
        }
        for (size_t i = axisIdx + 1; std::cmp_less(i, rank); ++i) {
            inner *= static_cast<size_t>(src->shape_[i]);
        }

        auto *dstData = reinterpret_cast<int32_t *>(dst->data_.get());

        // DO NOT swap loop order. This structure intentionally prioritizes the
        // most common case (axis = -1, inner = 1) for sequential access.
        for (size_t o = 0; o < outer; ++o) {
            for (size_t i = 0; i < inner; ++i) {
                float maxVal = -std::numeric_limits<float>::infinity();
                int32_t maxIdx = 0;
                for (size_t d = 0; d < axisDim; ++d) {
                    const float val = srcData[o * axisDim * inner + d * inner + i];
                    if (val > maxVal) {
                        maxVal = val;
                        maxIdx = static_cast<int32_t>(d);
                    }
                }
                dstData[o * inner + i] = maxIdx;
            }
        }

        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

void install_threshold(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "threshold";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: threshold(src, dst, threshold)");
        }

        auto src = tensor::fromJs(rt, "threshold: src", args[0], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "threshold: dst", args[1], DType::float32, src->shape_);

        tensor::checkNotSameTensor(rt, "threshold: src", src, "threshold: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "threshold: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "threshold: dst", dst);

        auto thresholdVal = conversions::asType<float>(rt, "threshold: threshold", args[2]);

        const auto *srcData = reinterpret_cast<const float *>(src->data_.get());
        auto *dstData = reinterpret_cast<float *>(dst->data_.get());

        for (size_t i = 0; i < src->numel_; ++i) {
            dstData[i] = (srcData[i] >= thresholdVal) ? 1.0f : 0.0f;
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}

} // namespace rnexecutorch::extensions::math
