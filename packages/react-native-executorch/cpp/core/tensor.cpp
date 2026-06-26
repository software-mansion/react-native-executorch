#include "tensor.h"
#include <cstring>
#include <numeric>

namespace rnexecutorch::core::tensor {
namespace jsi = facebook::jsi;

TensorHostObject::TensorHostObject(const std::vector<std::int32_t> &shape, rnexecutorch::core::types::DType dtype)
    : dtype_(dtype),
      shape_(shape),
      numel_(std::accumulate(shape.begin(), shape.end(), static_cast<size_t>(1), std::multiplies<size_t>())) {
    const auto elemSize = rnexecutorch::core::types::elementSize(dtype);

    size_ = numel_ * elemSize;
    // NOLINTNEXTLINE(cppcoreguidelines-avoid-c-arrays) — owning runtime-sized byte buffer
    data_ = std::make_unique<std::uint8_t[]>(size_);
    tensor_ = executorch::extension::from_blob(data_.get(), shape_, rnexecutorch::core::types::toScalarType(dtype));
}

jsi::Value TensorHostObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "shape") {
        auto jsArray = jsi::Array(rt, shape_.size());
        for (size_t i = 0; i < shape_.size(); ++i) {
            jsArray.setValueAtIndex(rt, i, static_cast<double>(shape_[i]));
        }
        return jsArray;
    }

    if (nameStr == "dtype") {
        return jsi::String::createFromUtf8(rt, rnexecutorch::core::types::toString(dtype_));
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

            if (!args[0].isObject() || !args[0].asObject(rt).isHostObject<TensorHostObject>(rt)) {
                throw jsi::JSError(rt, "copyTo: Expected dst to be a Tensor");
            }

            auto dst = args[0].asObject(rt).getHostObject<TensorHostObject>(rt);

            if (self.get() == dst.get()) {
                throw jsi::JSError(rt, "copyTo: In-place operations (src == dst) are not supported.");
            }

            std::shared_lock<std::shared_mutex> srcLock(self->mutex_, std::try_to_lock);
            if (!srcLock.owns_lock()) {
                throw jsi::JSError(rt, "copyTo: src tensor is currently in use");
            }

            std::unique_lock<std::shared_mutex> dstLock(dst->mutex_, std::try_to_lock);
            if (!dstLock.owns_lock()) {
                throw jsi::JSError(rt, "copyTo: dst tensor is currently in use");
            }

            if (!self->data_) {
                throw jsi::JSError(rt, "copyTo: src tensor has been disposed");
            }

            if (!dst->data_) {
                throw jsi::JSError(rt, "copyTo: dst tensor has been disposed");
            }

            size_t srcOffset = 0;
            size_t copyLen = self->numel_;
            if (count == 2 && args[1].isObject()) {
                auto optsObj = args[1].asObject(rt);
                if (optsObj.hasProperty(rt, "offset")) {
                    srcOffset = static_cast<size_t>(optsObj.getProperty(rt, "offset").asNumber());
                }

                copyLen -= srcOffset;

                if (optsObj.hasProperty(rt, "length")) {
                    copyLen = static_cast<size_t>(optsObj.getProperty(rt, "length").asNumber());
                }
            }

            if (srcOffset + copyLen > self->numel_) {
                throw jsi::JSError(rt, "copyTo: out of bounds offset and length for src tensor");
            }

            const auto elemSize = rnexecutorch::core::types::elementSize(self->dtype_);
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

            if (!args[0].isObject()) {
                throw jsi::JSError(rt, "setData: Expected array to be an object (TypedArray)");
            }

            const jsi::Object dataObj = args[0].asObject(rt);
            if (!dataObj.hasProperty(rt, "buffer")) {
                throw jsi::JSError(rt, "setData: Expected a TypedArray with a 'buffer' property");
            }

            const jsi::ArrayBuffer buffer = dataObj.getProperty(rt, "buffer").asObject(rt).getArrayBuffer(rt);
            size_t byteOffset = 0;
            size_t byteLength = buffer.size(rt);

            if (dataObj.hasProperty(rt, "byteOffset")) {
                auto byteOffsetValue = dataObj.getProperty(rt, "byteOffset");
                if (!byteOffsetValue.isNumber()) {
                    throw jsi::JSError(rt, "setData: Expected 'byteOffset' to be a number");
                }
                byteOffset = static_cast<size_t>(byteOffsetValue.asNumber());
            }

            if (dataObj.hasProperty(rt, "byteLength")) {
                auto byteLengthValue = dataObj.getProperty(rt, "byteLength");
                if (!byteLengthValue.isNumber()) {
                    throw jsi::JSError(rt, "setData: Expected 'byteLength' to be a number");
                }
                byteLength = static_cast<size_t>(byteLengthValue.asNumber());
            }

            std::unique_lock<std::shared_mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "setData: Tensor is currently in use and cannot be written to");
            }

            if (!self->data_) {
                throw jsi::JSError(rt, "setData: Tensor has been disposed");
            }

            if (byteLength != self->size_) {
                const std::string errorMsg = "setData: Data size mismatch: TypedArray is " + std::to_string(byteLength) +
                                             " bytes, but Tensor requires " + std::to_string(self->size_) +
                                             " bytes.";
                throw jsi::JSError(rt, errorMsg);
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

            if (!args[0].isObject()) {
                throw jsi::JSError(rt, "getData: Expected array to be an object (TypedArray)");
            }

            const jsi::Object dataObj = args[0].asObject(rt);
            if (!dataObj.hasProperty(rt, "buffer")) {
                throw jsi::JSError(rt, "getData: Expected a TypedArray with a 'buffer' property");
            }

            const jsi::ArrayBuffer buffer = dataObj.getProperty(rt, "buffer").asObject(rt).getArrayBuffer(rt);
            size_t byteOffset = 0;
            size_t byteLength = buffer.size(rt);

            if (dataObj.hasProperty(rt, "byteOffset")) {
                auto byteOffsetValue = dataObj.getProperty(rt, "byteOffset");
                if (!byteOffsetValue.isNumber()) {
                    throw jsi::JSError(rt, "getData: Expected 'byteOffset' to be a number");
                }
                byteOffset = static_cast<size_t>(byteOffsetValue.asNumber());
            }

            if (dataObj.hasProperty(rt, "byteLength")) {
                auto byteLengthValue = dataObj.getProperty(rt, "byteLength");
                if (!byteLengthValue.isNumber()) {
                    throw jsi::JSError(rt, "getData: Expected 'byteLength' to be a number");
                }
                byteLength = static_cast<size_t>(byteLengthValue.asNumber());
            }

            std::shared_lock<std::shared_mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "getData: Tensor is currently in use and cannot be read");
            }

            if (!self->data_) {
                throw jsi::JSError(rt, "getData: Tensor has been disposed");
            }

            if (byteLength != self->size_) {
                const std::string errorMsg = "getData: Data size mismatch: TypedArray is " + std::to_string(byteLength) +
                                             " bytes, but Tensor requires " + std::to_string(self->size_) +
                                             " bytes.";
                throw jsi::JSError(rt, errorMsg);
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

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
                throw jsi::JSError(rt, "through: First argument must be a function");
            }

            auto fn = args[0].asObject(rt).asFunction(rt);

            std::vector<jsi::Value> fnArgs;
            fnArgs.reserve(count);
            fnArgs.push_back(jsi::Value(rt, thisVal));
            for (size_t i = 1; i < count; ++i) {
                fnArgs.push_back(jsi::Value(rt, args[i]));
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

            const bool pred = args[0].asBool();
            if (!pred) {
                return jsi::Value(rt, thisVal);
            }

            if (!args[1].isObject() || !args[1].asObject(rt).isFunction(rt)) {
                throw jsi::JSError(rt, "throughIf: Second argument must be a function");
            }

            auto fn = args[1].asObject(rt).asFunction(rt);

            std::vector<jsi::Value> fnArgs;
            fnArgs.reserve(count - 1);
            fnArgs.push_back(jsi::Value(rt, thisVal));
            for (size_t i = 2; i < count; ++i) {
                fnArgs.push_back(jsi::Value(rt, args[i]));
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

std::vector<facebook::jsi::PropNameID> TensorHostObject::getPropertyNames(jsi::Runtime &rt) {
    std::vector<facebook::jsi::PropNameID> properties;
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

        if (!args[0].isObject() || !args[0].asObject(rt).isArray(rt)) {
            throw jsi::JSError(rt, "createTensor: Expected shape as an array of integers");
        }

        if (!args[1].isString()) {
            throw jsi::JSError(rt, "createTensor: Expected dtype as a string");
        }

        auto shapeArray = args[0].asObject(rt).asArray(rt);
        std::vector<std::int32_t> shape;
        for (size_t i = 0; i < shapeArray.length(rt); ++i) {
            auto dimValue = shapeArray.getValueAtIndex(rt, i);
            if (!dimValue.isNumber()) {
                throw jsi::JSError(rt, "createTensor: Shape array must contain only numbers");
            }

            if (dimValue.asNumber() <= 0) {
                throw jsi::JSError(rt, "createTensor: Shape dimensions must be positive integers");
            }

            shape.push_back(static_cast<std::int32_t>(dimValue.asNumber()));
        }

        try {
            const auto dtype = rnexecutorch::core::types::parseDType(args[1].asString(rt).utf8(rt));
            auto tensorHostObject = std::make_shared<TensorHostObject>(shape, dtype);
            return jsi::Object::createFromHostObject(rt, tensorHostObject);
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, "createTensor: Error creating tensor: " + std::string(e.what()));
        }
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody);

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::core::tensor
