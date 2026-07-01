#include "tensor.h"
#include "dtype.h"
#include "tensor_helpers.h"

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <format>
#include <numeric>
#include <optional>
#include <string>
#include <unordered_map>
#include <variant>

#include <executorch/extension/tensor/tensor_ptr_maker.h>

namespace rnexecutorch::core::tensor {
namespace types = rnexecutorch::core::types;
namespace conversions = rnexecutorch::core::conversions;

TensorHostObject::TensorHostObject(const std::vector<std::int32_t> &shape, DType dtype)
    : dtype_(dtype),
      shape_(shape),
      numel_(std::accumulate(shape.begin(), shape.end(), static_cast<size_t>(1), std::multiplies<>())),
      size_(numel_ * types::elementSize(dtype)) {
    data_ = std::make_unique<std::uint8_t[]>(size_); // NOLINT(cppcoreguidelines-avoid-c-arrays,modernize-avoid-c-arrays):
                                                     // owning runtime-sized byte buffer
    tensor_ = executorch::extension::from_blob(data_.get(), shape_, types::toScalarType(dtype));
}

jsi::Value TensorHostObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "shape") {
        return conversions::toJsiArray(rt, shape_);
    }

    if (nameStr == "dtype") {
        return jsi::String::createFromUtf8(rt, types::toString(dtype_));
    }

    if (nameStr == "numel") {
        return jsi::Value(static_cast<double>(numel_));
    }

    if (nameStr == "copyTo") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1 && count != 2) {
                throw jsi::JSError(rt, "copyTo: Usage: copyTo(dst, options?)");
            }

            auto dst = fromJs(rt, "copyTo: dst", args[0], std::nullopt, std::nullopt);

            checkNotSameTensor(rt, "copyTo: self", self, "copyTo: dst", dst);
            auto srcLock = tryLockShared(rt, "copyTo: self", self);
            auto dstLock = tryLockUnique(rt, "copyTo: dst", dst);

            const jsi::Object optsObj = (count == 2 && args[1].isObject()) ? args[1].asObject(rt) : jsi::Object(rt);
            const size_t srcOffset = conversions::getOptionalProperty<size_t>(rt, "copyTo", optsObj, "offset").value_or(0);
            const size_t copyLen = conversions::getOptionalProperty<size_t>(rt, "copyTo", optsObj, "length").value_or(self->numel_ - srcOffset);

            if (srcOffset + copyLen > self->numel_) {
                throw jsi::JSError(rt, "copyTo: out of bounds offset and length for src tensor");
            }

            const auto elemSize = types::elementSize(self->dtype_);

            if (copyLen * elemSize != dst->size_) {
                throw jsi::JSError(rt, "copyTo: size mismatch between copy byte size and dst tensor size");
            }

            std::memcpy(dst->data_.get(), self->data_.get() + (srcOffset * elemSize), copyLen * elemSize);

            return jsi::Value(rt, args[0].asObject(rt));
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "copyTo"), 1, fnBody);
    }

    if (nameStr == "setData") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw jsi::JSError(rt, "setData: Usage: setData(array)");
            }

            const auto dataObj = args[0].asObject(rt);
            const auto buffer = dataObj.getProperty(rt, "buffer").asObject(rt).getArrayBuffer(rt);
            size_t byteOffset = conversions::getOptionalProperty<size_t>(rt, "setData", dataObj, "byteOffset").value_or(0);
            size_t byteLength = conversions::getOptionalProperty<size_t>(rt, "setData", dataObj, "byteLength").value_or(buffer.size(rt));

            auto lock = tryLockUnique(rt, "setData: self", self);

            if (byteLength != self->size_) {
                throw jsi::JSError(rt, std::format("setData: Data size mismatch: TypedArray is {} bytes, but Tensor requires {} bytes.",
                                                   byteLength, self->size_));
            }

            std::memcpy(self->data_.get(), buffer.data(rt) + byteOffset, byteLength);

            return jsi::Value(rt, thisVal.asObject(rt));
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "setData"), 1, fnBody);
    }

    if (nameStr == "getData") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw jsi::JSError(rt, "getData: Usage: getData(array)");
            }

            const jsi::Object dataObj = args[0].asObject(rt);
            const jsi::ArrayBuffer buffer = dataObj.getProperty(rt, "buffer").asObject(rt).getArrayBuffer(rt);
            size_t byteOffset = conversions::getOptionalProperty<size_t>(rt, "getData", dataObj, "byteOffset").value_or(0);
            size_t byteLength = conversions::getOptionalProperty<size_t>(rt, "getData", dataObj, "byteLength").value_or(buffer.size(rt));

            auto lock = tryLockShared(rt, "getData: self", self);

            if (byteLength != self->size_) {
                throw jsi::JSError(rt, std::format("getData: Data size mismatch: TypedArray is {} bytes, but Tensor requires {} bytes.",
                                                   byteLength, self->size_));
            }

            std::memcpy(buffer.data(rt) + byteOffset, self->data_.get(), byteLength);

            return jsi::Value(rt, args[0].asObject(rt));
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "getData"), 1, fnBody);
    }

    if (nameStr == "through") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 1) {
                throw jsi::JSError(rt, "through: Usage: through(fn, ...args)");
            }

            auto fn = args[0].asObject(rt).asFunction(rt);

            std::vector<jsi::Value> fnArgs;
            fnArgs.reserve(count);
            fnArgs.emplace_back(rt, thisVal);
            for (size_t i = 1; i < count; ++i) {
                fnArgs.emplace_back(rt, args[i]);
            }

            return fn.call(rt, static_cast<const jsi::Value *>(fnArgs.data()), fnArgs.size());
        };

        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "through"), 1, fnBody);
    }

    if (nameStr == "throughIf") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count < 2) {
                throw jsi::JSError(rt, "throughIf: Usage: throughIf(pred, fn, ...args)");
            }

            const bool pred = conversions::asType<bool>(rt, "throughIf: pred", args[0]);
            if (!pred) {
                return jsi::Value(rt, thisVal);
            }

            auto fn = args[1].asObject(rt).asFunction(rt);

            std::vector<jsi::Value> fnArgs;
            fnArgs.reserve(count - 1);
            fnArgs.emplace_back(rt, thisVal);
            for (size_t i = 2; i < count; ++i) {
                fnArgs.emplace_back(rt, args[i]);
            }

            return fn.call(rt, static_cast<const jsi::Value *>(fnArgs.data()), fnArgs.size());
        };

        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "throughIf"), 2, fnBody);
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw jsi::JSError(rt, "dispose: Usage: dispose()");
            }

            std::unique_lock<std::shared_mutex> lock(self->mutex_);

            if (!self->data_) {
                throw jsi::JSError(rt, "dispose: Tensor has already been disposed");
            }

            self->tensor_.reset();
            self->data_.reset();

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, fnBody);
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
            throw jsi::JSError(rt, "createTensor: Usage: createTensor(shape, dtype)");
        }

        auto shape = conversions::asVector<int32_t>(rt, "createTensor: shape", args[0]);
        if (std::ranges::any_of(shape, [](auto dim) { return dim <= 0; })) {
            throw jsi::JSError(rt, "createTensor: Shape dimensions must be positive integers");
        }

        try {
            const auto dtype = types::parseDType(conversions::asType<std::string>(rt, "createTensor: dtype", args[1]));
            return jsi::Object::createFromHostObject(rt, std::make_shared<TensorHostObject>(shape, dtype));
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, std::format("createTensor: Error creating tensor: {}", e.what()));
        }
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody);

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::core::tensor
