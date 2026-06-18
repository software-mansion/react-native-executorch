#include "operations.h"

#include <algorithm>
#include <cmath>
#include <limits>

#include "core/tensor.h"

namespace rnexecutorch::extensions::math {
namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

void install_sigmoid(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "sigmoid";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "Usage: sigmoid(src, dst)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "sigmoid: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "sigmoid: dst must be a Tensor");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "sigmoid: In-place operations (src == dst) are not supported.");
        }

        if (src->shape_ != dst->shape_) {
            throw jsi::JSError(rt, "sigmoid: src and dst must have the same shape");
        }

        if (src->dtype_ != dst->dtype_) {
            throw jsi::JSError(rt, "sigmoid: src and dst must have the same dtype");
        }

        if (src->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "sigmoid: only float32 tensors are supported");
        }

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock()) {
            throw jsi::JSError(rt, "sigmoid: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "sigmoid: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "sigmoid: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "sigmoid: dst tensor has been disposed");
        }

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
    auto name = "softmax";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: softmax(src, dst, axis)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "softmax: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "softmax: dst must be a Tensor");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "softmax: In-place operations (src == dst) are not supported.");
        }

        if (src->shape_ != dst->shape_) {
            throw jsi::JSError(rt, "softmax: src and dst must have the same shape");
        }

        if (src->dtype_ != dst->dtype_) {
            throw jsi::JSError(rt, "softmax: src and dst must have the same dtype");
        }

        if (src->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "softmax: only float32 tensors are supported");
        }

        if (src->shape_.empty()) {
            throw jsi::JSError(rt, "softmax: src must have at least one dimension");
        }

        if (!args[2].isNumber()) {
            throw jsi::JSError(rt, "softmax: axis must be a number");
        }
        int axis = static_cast<int>(args[2].asNumber());

        const int rank = static_cast<int>(src->shape_.size());
        if (axis < 0) {
            axis += rank;
        }

        if (axis < 0 || axis >= rank) {
            throw jsi::JSError(rt, "softmax: axis is out of range");
        }

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock()) {
            throw jsi::JSError(rt, "softmax: src tensor is currently in use");
        }

        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "softmax: dst tensor is currently in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "softmax: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "softmax: dst tensor has been disposed");
        }

        const auto *srcData = reinterpret_cast<const float *>(src->data_.get());
        auto *dstData = reinterpret_cast<float *>(dst->data_.get());

        const size_t axisDim = static_cast<size_t>(src->shape_[axis]);
        if (axisDim == 0) {
            throw jsi::JSError(rt, "softmax: axis dimension must be greater than zero");
        }

        size_t outer = 1;
        for (int i = 0; i < axis; ++i) {
            outer *= static_cast<size_t>(src->shape_[i]);
        }

        size_t inner = 1;
        for (int i = axis + 1; i < rank; ++i) {
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
    auto name = "argmax";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw jsi::JSError(rt, "Usage: argmax(src, dst, axis)");
        }

        if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "argmax: src must be a Tensor");
        }

        if (!args[1].isObject() || !args[1].asObject(rt).isHostObject<TensorHostObject>(rt)) {
            throw jsi::JSError(rt, "argmax: dst must be a Tensor");
        }

        auto src = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);
        auto dst = args[1].asObject(rt).getHostObject<TensorHostObject>(rt);

        if (src.get() == dst.get()) {
            throw jsi::JSError(rt, "argmax: In-place operations (src == dst) are not supported.");
        }

        if (src->dtype_ != rnexecutorch::core::types::DType::float32) {
            throw jsi::JSError(rt, "argmax: src must be float32");
        }
        if (dst->dtype_ != rnexecutorch::core::types::DType::int32) {
            throw jsi::JSError(rt, "argmax: dst must be int32");
        }

        if (!args[2].isNumber()) {
            throw jsi::JSError(rt, "argmax: axis must be a number");
        }
        int axis = static_cast<int>(args[2].asNumber());

        int rank = src->shape_.size();
        if (axis < 0) {
            axis += rank;
        }
        if (axis < 0 || axis >= rank) {
            throw jsi::JSError(rt, "argmax: axis is out of range");
        }

        auto dst_expected_shape = src->shape_;
        dst_expected_shape[axis] = 1;
        if (dst->shape_ != dst_expected_shape) {
            throw jsi::JSError(rt, "argmax: dst shape must match src shape but with axis dimension 1");
        }

        std::shared_lock<std::shared_mutex> src_lock(src->mutex_, std::try_to_lock);
        std::unique_lock<std::shared_mutex> dst_lock(dst->mutex_, std::try_to_lock);
        if (!src_lock.owns_lock() || !dst_lock.owns_lock()) {
            throw jsi::JSError(rt, "argmax: tensors in use");
        }

        if (!src->data_) {
            throw jsi::JSError(rt, "argmax: src tensor has been disposed");
        }

        if (!dst->data_) {
            throw jsi::JSError(rt, "argmax: dst tensor has been disposed");
        }

        const float *srcData = reinterpret_cast<const float *>(src->data_.get());

        size_t axisDim = src->shape_[axis];
        size_t outer = 1, inner = 1;
        for (int i = 0; i < axis; ++i) {
            outer *= src->shape_[i];
        }
        for (int i = axis + 1; i < rank; ++i) {
            inner *= src->shape_[i];
        }

        int32_t *dstData = reinterpret_cast<int32_t *>(dst->data_.get());
        for (size_t o = 0; o < outer; ++o) {
            for (size_t i = 0; i < inner; ++i) {
                float max_val = -std::numeric_limits<float>::infinity();
                int32_t max_idx = 0;
                for (size_t d = 0; d < axisDim; ++d) {
                    float val = srcData[o * axisDim * inner + d * inner + i];
                    if (val > max_val) {
                        max_val = val;
                        max_idx = static_cast<int32_t>(d);
                    }
                }
                dstData[o * inner + i] = max_idx;
            }
        }

        return jsi::Value(rt, args[1]);
    };
    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, fnBody));
}
} // namespace rnexecutorch::extensions::math
