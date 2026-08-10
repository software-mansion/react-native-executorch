#include "tensor.h"

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <format>
#include <numeric>
#include <optional>
#include <string>

#include "core/conversions.h"
#include "dtype.h"
#include "tensor_helpers.h"

#include <executorch/extension/tensor/tensor_ptr_maker.h>

#include "core/error.h"
namespace {
using rnexecutorch::core::error::RnExecuTorchErrorCode;
using rnexecutorch::core::error::RnExecuTorchException;
} // namespace

namespace rnexecutorch::core::tensor {
namespace types = rnexecutorch::core::types;
namespace conversions = rnexecutorch::core::conversions;

using rnexecutorch::core::conversions::getOptionalProperty;
using rnexecutorch::core::conversions::getRequiredProperty;

TensorHostObject::TensorHostObject(const std::vector<std::int32_t> &shape, DType dtype)
    : dtype_(dtype),
      shape_(shape),
      numel_(std::accumulate(shape.begin(), shape.end(), static_cast<size_t>(1), std::multiplies<>())),
      size_(numel_ * types::elementSize(dtype)) {
    // NOLINTNEXTLINE(cppcoreguidelines-avoid-c-arrays,modernize-avoid-c-arrays): owning runtime-sized byte buffer
    data_ = std::make_unique<std::uint8_t[]>(size_);
    tensor_ = executorch::extension::from_blob(data_.get(), shape_, types::dtypeToScalarType(dtype));
}

jsi::Value TensorHostObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "shape") {
        return conversions::toJsiArray(rt, shape_);
    }

    if (nameStr == "dtype") {
        return jsi::String::createFromUtf8(rt, types::dtypeToString(dtype_));
    }

    if (nameStr == "numel") {
        return jsi::Value(static_cast<double>(numel_));
    }

    if (nameStr == "copyTo") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1 && count != 2) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "copyTo: Usage: copyTo(dst, options?)");
            }

            auto dst = tensor::fromJs(rt, "copyTo: dst", args[0], std::nullopt, std::nullopt);

            checkNotSameTensor(rt, "copyTo: self", self, "copyTo: dst", dst);
            auto srcLock = tryLockShared(rt, "copyTo: self", self);
            auto dstLock = tryLockUnique(rt, "copyTo: dst", dst);

            jsi::Object optsObj(rt);
            if (count == 2) {
                optsObj = conversions::asType<jsi::Object>(rt, "copyTo: options", args[1]);
            }

            size_t offset = getOptionalProperty<uint64_t>(rt, "copyTo: options", optsObj, "offset").value_or(0);
            if (offset > self->numel_) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("copyTo: offset {} is out of bounds for src tensor of size {} elements",
                                                                                                offset, self->numel_));
            }

            size_t length = getOptionalProperty<uint64_t>(rt, "copyTo: options", optsObj, "length").value_or(self->numel_ - offset);
            if (length > self->numel_ - offset) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("copyTo: length {} is out of bounds for offset {} of src tensor (numel {})",
                                                                                                length, offset, self->numel_));
            }

            const auto elemSize = types::elementSize(self->dtype_);

            if (length * elemSize != dst->size_) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("copyTo: size mismatch between copy size ({} bytes) and dst tensor size ({} bytes)",
                                                                                                length * elemSize, dst->size_));
            }

            std::memcpy(dst->data_.get(), self->data_.get() + (offset * elemSize), length * elemSize);

            return jsi::Value(rt, args[0]);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "copyTo"), 1, error::guarded(fnBody));
    }

    if (nameStr == "setData") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "setData: Usage: setData(array)");
            }

            auto dataObj = conversions::asType<jsi::Object>(rt, "setData: array", args[0]);
            auto buffer = getRequiredProperty<jsi::ArrayBuffer>(rt, "setData: array", dataObj, "buffer");
            size_t byteOffset = getOptionalProperty<uint64_t>(rt, "setData: array", dataObj, "byteOffset").value_or(0);
            size_t byteLength = getOptionalProperty<uint64_t>(rt, "setData: array", dataObj, "byteLength").value_or(buffer.size(rt));

            auto lock = tryLockUnique(rt, "setData: self", self);

            if (byteOffset > buffer.size(rt) || byteLength > buffer.size(rt) - byteOffset) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("setData: Out of bounds offset ({}) or length ({}) for buffer of size {}",
                                                                                                byteOffset, byteLength, buffer.size(rt)));
            }

            if (byteLength != self->size_) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("setData: Data size mismatch: TypedArray is {} bytes, but Tensor requires {} bytes.",
                                                                                                byteLength, self->size_));
            }

            std::memcpy(self->data_.get(), buffer.data(rt) + byteOffset, byteLength);

            return jsi::Value(rt, thisVal);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "setData"), 1, error::guarded(fnBody));
    }

    if (nameStr == "getData") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "getData: Usage: getData(array)");
            }

            auto dataObj = conversions::asType<jsi::Object>(rt, "getData: array", args[0]);
            auto buffer = getRequiredProperty<jsi::ArrayBuffer>(rt, "getData: array", dataObj, "buffer");
            size_t byteOffset = getOptionalProperty<uint64_t>(rt, "getData: array", dataObj, "byteOffset").value_or(0);
            size_t byteLength = getOptionalProperty<uint64_t>(rt, "getData: array", dataObj, "byteLength").value_or(buffer.size(rt));

            auto lock = tryLockShared(rt, "getData: self", self);

            if (byteOffset > buffer.size(rt) || byteLength > buffer.size(rt) - byteOffset) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("getData: Out of bounds offset ({}) or length ({}) for buffer of size {}",
                                                                                                byteOffset, byteLength, buffer.size(rt)));
            }

            if (byteLength != self->size_) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, std::format("getData: Data size mismatch: TypedArray is {} bytes, but Tensor requires {} bytes.",
                                                                                                byteLength, self->size_));
            }

            std::memcpy(buffer.data(rt) + byteOffset, self->data_.get(), byteLength);

            return jsi::Value(rt, args[0]);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "getData"), 1, error::guarded(fnBody));
    }

    if (nameStr == "through") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "through: Usage: through(fn, ...args)");
            }

            auto fn = conversions::asType<jsi::Function>(rt, "through: fn", args[0]);

            std::vector<jsi::Value> fnArgs;
            fnArgs.reserve(count);
            fnArgs.emplace_back(rt, thisVal);
            for (size_t i = 1; i < count; ++i) {
                fnArgs.emplace_back(rt, args[i]);
            }

            return fn.call(rt, static_cast<const jsi::Value *>(fnArgs.data()), fnArgs.size());
        };

        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "through"), 1, error::guarded(fnBody));
    }

    if (nameStr == "throughIf") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 2) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "throughIf: Usage: throughIf(pred, fn, ...args)");
            }

            const bool pred = conversions::asType<bool>(rt, "throughIf: pred", args[0]);
            if (!pred) {
                return jsi::Value(rt, thisVal);
            }

            auto fn = conversions::asType<jsi::Function>(rt, "throughIf: fn", args[1]);

            std::vector<jsi::Value> fnArgs;
            fnArgs.reserve(count - 1);
            fnArgs.emplace_back(rt, thisVal);
            for (size_t i = 2; i < count; ++i) {
                fnArgs.emplace_back(rt, args[i]);
            }

            return fn.call(rt, static_cast<const jsi::Value *>(fnArgs.data()), fnArgs.size());
        };

        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "throughIf"), 2, error::guarded(fnBody));
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime & /*rt*/, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "dispose: Usage: dispose()");
            }

            std::unique_lock<std::shared_mutex> lock(self->mutex_);

            if (!self->data_) {
                throw RnExecuTorchException(RnExecuTorchErrorCode::ResourceDisposed, "dispose: Tensor has already been disposed");
            }

            self->tensor_.reset();
            self->data_.reset();

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, error::guarded(fnBody));
    }

    return jsi::Value::undefined();
}

std::vector<jsi::PropNameID> TensorHostObject::getPropertyNames(jsi::Runtime &rt) {
    std::vector<jsi::PropNameID> properties;
    properties.push_back(jsi::PropNameID::forAscii(rt, "shape"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "dtype"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "numel"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "copyTo"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "setData"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "getData"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "through"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "throughIf"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "dispose"));
    return properties;
}

void install_createTensor(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "createTensor";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "createTensor: Usage: createTensor(shape, dtype)");
        }

        auto shape = conversions::asVector<int32_t>(rt, "createTensor: shape", args[0]);
        if (std::ranges::any_of(shape, [](auto dim) { return dim <= 0; })) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::InvalidArgument, "createTensor: Shape dimensions must be positive integers");
        }

        try {
            const auto dtype = types::dtypeFromString(conversions::asType<std::string>(rt, "createTensor: dtype", args[1]));
            return jsi::Object::createFromHostObject(rt, std::make_shared<TensorHostObject>(shape, dtype));
        } catch (const std::exception &e) {
            throw RnExecuTorchException(RnExecuTorchErrorCode::Unknown, std::format("createTensor: Error creating tensor: {}", e.what()));
        }
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, error::guarded(fnBody));

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::core::tensor
