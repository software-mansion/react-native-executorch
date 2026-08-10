#include "operations.h"

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <optional>
#include <span>
#include <utility>

#include "core/tensor.h"
#include "core/tensor_helpers.h"

#include "core/error.h"
namespace {
namespace error = rnexecutorch::core::error;
using rnexecutorch::core::error::RnExecuTorchErrorCode;
using rnexecutorch::core::error::RnExecuTorchException;
} // namespace

namespace rnexecutorch::extensions::math {
namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;

namespace tensor = rnexecutorch::core::tensor;
using rnexecutorch::core::types::DType;

void install_sigmoid(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "sigmoid";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "Usage: sigmoid(src, dst)");
        }

        auto src = tensor::fromJs(rt, "sigmoid: src", args[0], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "sigmoid: dst", args[1], DType::float32, src->shape_);

        tensor::checkNotSameTensor(rt, "sigmoid: src", src, "sigmoid: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "sigmoid: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "sigmoid: dst", dst);

        const std::span<const float> srcData(reinterpret_cast<const float *>(src->data_.get()), src->numel_);
        const std::span<float> dstData(reinterpret_cast<float *>(dst->data_.get()), dst->numel_);

        std::ranges::transform(srcData, dstData.begin(), [](const float value) {
            return 1.0f / (1.0f + std::exp(-value));
        });

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, error::guarded(fnBody)));
}

void install_softmax(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "softmax";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "Usage: softmax(src, dst, axis)");
        }

        auto src = tensor::fromJs(rt, "softmax: src", args[0], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "softmax: dst", args[1], DType::float32, src->shape_);

        tensor::checkNotSameTensor(rt, "softmax: src", src, "softmax: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "softmax: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "softmax: dst", dst);

        if (src->shape_.empty()) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "softmax: src must have at least one dimension");
        }

        int axis = conversions::asType<int32_t>(rt, "softmax: axis", args[2]);
        const int rank = static_cast<int>(src->shape_.size());

        // Support negative axis indices like numpy (e.g., axis=-1 means last
        // axis, -2 means second to last, etc.)
        if (axis < 0) {
            axis += rank;
        }
        if (axis < 0 || axis >= rank) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("softmax: axis {} out of range for tensor of rank {}",
                                                                                            axis, rank));
        }
        const auto axisIdx = static_cast<size_t>(axis);

        const std::span<const float> srcData(reinterpret_cast<const float *>(src->data_.get()), src->numel_);
        const std::span<float> dstData(reinterpret_cast<float *>(dst->data_.get()), dst->numel_);

        const auto axisDim = static_cast<size_t>(src->shape_[axisIdx]);
        if (axisDim == 0) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "softmax: axis dimension must be greater than zero");
        }

        size_t outer = 1;
        for (size_t i = 0; std::cmp_less(i, axis); ++i) {
            outer *= static_cast<size_t>(src->shape_[i]);
        }

        size_t inner = 1;
        for (size_t i = axisIdx + 1; std::cmp_less(i, rank); ++i) {
            inner *= static_cast<size_t>(src->shape_[i]);
        }

        // Elements along `axis` are strided by `inner`, so a lane spans from its
        // first element to its last: (axisDim - 1) * inner + 1 elements.
        const size_t laneSize = (axisDim - 1) * inner + 1;

        for (size_t outerIndex = 0; outerIndex < outer; ++outerIndex) {
            for (size_t innerIndex = 0; innerIndex < inner; ++innerIndex) {
                const size_t base = outerIndex * axisDim * inner + innerIndex;
                const auto srcLane = srcData.subspan(base, laneSize);
                const auto dstLane = dstData.subspan(base, laneSize);

                float maxValue = -std::numeric_limits<float>::infinity();
                for (size_t axisIndex = 0; axisIndex < axisDim; ++axisIndex) {
                    maxValue = std::max(maxValue, srcLane[axisIndex * inner]);
                }

                float sum = 0.0f;
                for (size_t axisIndex = 0; axisIndex < axisDim; ++axisIndex) {
                    const float value = std::exp(srcLane[axisIndex * inner] - maxValue);
                    dstLane[axisIndex * inner] = value;
                    sum += value;
                }

                for (size_t axisIndex = 0; axisIndex < axisDim; ++axisIndex) {
                    dstLane[axisIndex * inner] /= sum;
                }
            }
        }

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

void install_argmax(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "argmax";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "Usage: argmax(src, dst, axis)");
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
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("argmax: axis {} out of range for tensor of rank {}",
                                                                                            axis, rank));
        }
        const auto axisIdx = static_cast<size_t>(axis);

        auto dstExpectedShape = src->shape_;
        dstExpectedShape[axisIdx] = 1;
        if (dst->shape_ != dstExpectedShape) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "argmax: dst shape must match src shape but with axis dimension 1");
        }

        const std::span<const float> srcData(reinterpret_cast<const float *>(src->data_.get()), src->numel_);

        const auto axisDim = static_cast<size_t>(src->shape_[axisIdx]);
        if (axisDim == 0) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "argmax: axis dimension must be greater than zero");
        }

        size_t outer = 1;
        size_t inner = 1;
        for (size_t i = 0; std::cmp_less(i, axis); ++i) {
            outer *= static_cast<size_t>(src->shape_[i]);
        }
        for (size_t i = axisIdx + 1; std::cmp_less(i, rank); ++i) {
            inner *= static_cast<size_t>(src->shape_[i]);
        }

        const std::span<int32_t> dstData(reinterpret_cast<int32_t *>(dst->data_.get()), dst->numel_);

        // Elements along `axis` are strided by `inner`, so a lane spans from its
        // first element to its last: (axisDim - 1) * inner + 1 elements.
        const size_t laneSize = (axisDim - 1) * inner + 1;

        // DO NOT swap loop order. This structure intentionally prioritizes the
        // most common case (axis = -1, inner = 1) for sequential access.
        for (size_t o = 0; o < outer; ++o) {
            for (size_t i = 0; i < inner; ++i) {
                const auto srcLane = srcData.subspan(o * axisDim * inner + i, laneSize);

                float maxVal = -std::numeric_limits<float>::infinity();
                int32_t maxIdx = 0;
                for (size_t d = 0; d < axisDim; ++d) {
                    const float val = srcLane[d * inner];
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
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

void install_threshold(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "threshold";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "Usage: threshold(src, dst, threshold)");
        }

        auto src = tensor::fromJs(rt, "threshold: src", args[0], DType::float32, std::nullopt);
        auto dst = tensor::fromJs(rt, "threshold: dst", args[1], DType::float32, src->shape_);

        tensor::checkNotSameTensor(rt, "threshold: src", src, "threshold: dst", dst);
        auto srcLock = tensor::tryLockShared(rt, "threshold: src", src);
        auto dstLock = tensor::tryLockUnique(rt, "threshold: dst", dst);

        auto thresholdVal = conversions::asType<float>(rt, "threshold: threshold", args[2]);

        const std::span<const float> srcData(reinterpret_cast<const float *>(src->data_.get()), src->numel_);
        const std::span<float> dstData(reinterpret_cast<float *>(dst->data_.get()), dst->numel_);

        std::ranges::transform(srcData, dstData.begin(), [thresholdVal](const float value) {
            return (value >= thresholdVal) ? 1.0f : 0.0f;
        });

        return jsi::Value(rt, args[1]);
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::math
