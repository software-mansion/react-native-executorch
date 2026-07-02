#include "model.h"
#include "dtype.h"
#include "tensor_helpers.h"

#include <chrono>
#include <exception>
#include <format>
#include <jsi/jsi.h>
#include <unordered_set>
#include <utility>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/tag.h>

namespace {
template <typename T>
T getOrThrow(facebook::jsi::Runtime &rt, const std::string &ctx,
             executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw facebook::jsi::JSError(rt, std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())));
    }
    return std::move(result.get());
}

rnexecutorch::core::types::DType
getDTypeOrThrow(facebook::jsi::Runtime &rt, const std::string &ctx,
                executorch::aten::ScalarType scalarType) {
    try {
        return rnexecutorch::core::types::fromScalarType(scalarType);
    } catch (const std::exception &e) {
        throw facebook::jsi::JSError(rt, std::format("{}: Unsupported tensor dtype: {}", ctx, e.what()));
    }
}
} // namespace

namespace rnexecutorch::core::model {
namespace jsi = facebook::jsi;
namespace types = rnexecutorch::core::types;
namespace conversions = rnexecutorch::core::conversions;

using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

ModelHostObject::ModelHostObject(const std::string &modelPath)
    : modelPath_(modelPath),
      etModule_(std::make_unique<executorch::extension::Module>(modelPath)) {
    auto error = etModule_->load();
    if (!etModule_->is_loaded()) {
        const std::string errorMsg = executorch::runtime::to_string(error);
        throw std::runtime_error(std::format("Failed to load model: {}", errorMsg));
    }
}

jsi::Value ModelHostObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "path") {
        return jsi::String::createFromUtf8(rt, modelPath_);
    }

    if (nameStr == "getMethodNames") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw jsi::JSError(rt, "getMethodNames: Usage: getMethodNames()");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "getMethodNames: Model is currently in use");
            }

            if (!self->etModule_) {
                throw jsi::JSError(rt, "getMethodNames: Model has been disposed");
            }

            auto methodNames = getOrThrow(rt, "getMethodNames", self->etModule_->method_names());

            auto jsArray = jsi::Array(rt, methodNames.size());
            size_t index = 0;
            for (const auto &methodName : methodNames) {
                jsArray.setValueAtIndex(rt, index, jsi::String::createFromUtf8(rt, methodName));
                ++index;
            }

            return jsArray;
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "getMethodNames"), 0, fnBody);
    }

    if (nameStr == "getMethodMeta") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw jsi::JSError(rt, "getMethodMeta: Usage: getMethodMeta(methodName)");
            }

            if (!args[0].isString()) {
                throw jsi::JSError(rt, "getMethodMeta: Expected methodName to be a string");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "getMethodMeta: Model is currently in use");
            }

            if (!self->etModule_) {
                throw jsi::JSError(rt, "getMethodMeta: Model has been disposed");
            }

            auto methodName = conversions::asType<std::string>(rt, "getMethodMeta: methodName", args[0]);
            auto methodMeta = getOrThrow(rt, "getMethodMeta", self->etModule_->method_meta(methodName));

            auto inputTagsArray = jsi::Array(rt, methodMeta.num_inputs());
            for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
                auto tag = getOrThrow(rt, std::format("getMethodMeta: input tag [{}]", i), methodMeta.input_tag(i));
                inputTagsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, executorch::runtime::tag_to_string(tag)));
            }

            auto outputTagsArray = jsi::Array(rt, methodMeta.num_outputs());
            for (size_t i = 0; i < methodMeta.num_outputs(); ++i) {
                auto tag = getOrThrow(rt, std::format("getMethodMeta: output tag [{}]", i), methodMeta.output_tag(i));
                outputTagsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, executorch::runtime::tag_to_string(tag)));
            }

            auto usesBackendMap = jsi::Object(rt);
            for (size_t i = 0; i < methodMeta.num_backends(); ++i) {
                const auto *backendName = getOrThrow(rt, std::format("getMethodMeta: backend name [{}]", i), methodMeta.get_backend_name(i));
                usesBackendMap.setProperty(rt, backendName, methodMeta.uses_backend(backendName));
            }

            auto tensorMetaToJS = [](jsi::Runtime &rt, const executorch::runtime::TensorInfo &tensorMeta) -> jsi::Object {
                auto jsTensorMeta = jsi::Object(rt);
                jsTensorMeta.setProperty(rt, "name", jsi::String::createFromUtf8(rt, std::string(tensorMeta.name())));
                jsTensorMeta.setProperty(rt, "ndim", static_cast<double>(tensorMeta.sizes().size()));
                jsTensorMeta.setProperty(rt, "nbytes", static_cast<double>(tensorMeta.nbytes()));

                try {
                    auto dtypeStr = types::toString(types::fromScalarType(tensorMeta.scalar_type()));
                    jsTensorMeta.setProperty(rt, "dtype", jsi::String::createFromUtf8(rt, dtypeStr));
                } catch (const std::exception &) {
                    jsTensorMeta.setProperty(rt, "dtype", jsi::String::createFromUtf8(rt, "not supported"));
                }

                auto jsShapeArray = jsi::Array(rt, tensorMeta.sizes().size());
                for (size_t i = 0; i < tensorMeta.sizes().size(); ++i) {
                    jsShapeArray.setValueAtIndex(rt, i, static_cast<double>(tensorMeta.sizes()[i]));
                }
                jsTensorMeta.setProperty(rt, "shape", jsShapeArray);

                return jsTensorMeta;
            };

            auto inputTensorMetaArray = jsi::Array(rt, methodMeta.num_inputs());
            for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
                auto tensorMeta = getOrThrow(rt, std::format("getMethodMeta: input tensor meta [{}]", i), methodMeta.input_tensor_meta(i));
                inputTensorMetaArray.setValueAtIndex(rt, i, tensorMetaToJS(rt, tensorMeta));
            }

            auto outputTensorMetaArray = jsi::Array(rt, methodMeta.num_outputs());
            for (size_t i = 0; i < methodMeta.num_outputs(); ++i) {
                auto tensorMeta = getOrThrow(rt, std::format("getMethodMeta: output tensor meta [{}]", i), methodMeta.output_tensor_meta(i));
                outputTensorMetaArray.setValueAtIndex(rt, i, tensorMetaToJS(rt, tensorMeta));
            }

            auto jsMeta = jsi::Object(rt);
            jsMeta.setProperty(rt, "name", jsi::String::createFromUtf8(rt, methodMeta.name()));
            jsMeta.setProperty(rt, "numInputs", static_cast<double>(methodMeta.num_inputs()));
            jsMeta.setProperty(rt, "numOutputs", static_cast<double>(methodMeta.num_outputs()));
            jsMeta.setProperty(rt, "inputTags", inputTagsArray);
            jsMeta.setProperty(rt, "outputTags", outputTagsArray);
            jsMeta.setProperty(rt, "usesBackend", usesBackendMap);
            jsMeta.setProperty(rt, "inputTensorMeta", inputTensorMetaArray);
            jsMeta.setProperty(rt, "outputTensorMeta", outputTensorMetaArray);

            return jsMeta;
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "getMethodMeta"), 1, fnBody);
    }

    if (nameStr == "execute") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 3) {
                throw jsi::JSError(rt, "execute: Usage: execute(methodName, inputs, outputTensors)");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "execute: Model is currently in use");
            }

            if (!self->etModule_) {
                throw jsi::JSError(rt, "execute: Model has been disposed");
            }

            auto methodName = conversions::asType<std::string>(rt, "execute: methodName", args[0]);
            auto methodMeta = getOrThrow(rt, std::format("execute: method meta for '{}'", methodName),
                                         self->etModule_->method_meta(methodName));

            auto inputsArray = args[1].asObject(rt).asArray(rt);
            auto outputTensorsArray = args[2].asObject(rt).asArray(rt);

            if (inputsArray.size(rt) != methodMeta.num_inputs()) {
                throw jsi::JSError(rt, std::format("execute: Incorrect size for inputs: got {}, expected {}",
                                                   inputsArray.size(rt), methodMeta.num_inputs()));
            }

            std::vector<executorch::runtime::EValue> inputs(methodMeta.num_inputs());
            std::vector<std::unique_lock<std::shared_mutex>> tensorLocks;
            std::unordered_set<TensorHostObject *> lockedTensors;

            for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
                auto tag = getOrThrow(rt, std::format("execute: inputs[{}] tag", i), methodMeta.input_tag(i));
                auto val = inputsArray.getValueAtIndex(rt, i);
                auto ctx = std::format("execute: inputs[{}]", i);

                switch (tag) {
                case executorch::runtime::Tag::Tensor: {
                    auto tensorMeta = getOrThrow(rt, std::format("{}: tensor meta", ctx), methodMeta.input_tensor_meta(i));
                    auto expectedDtype = getDTypeOrThrow(rt, ctx, tensorMeta.scalar_type());
                    auto tensorHostObject = tensor::fromJs(rt, ctx, val, expectedDtype, tensorMeta.sizes());

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. "
                                               "The same tensor was passed multiple times.");
                    }
                    tensorLocks.emplace_back(tensor::tryLockUnique(rt, ctx, tensorHostObject));

                    inputs[i] = tensorHostObject->tensor_;
                    break;
                }
                case executorch::runtime::Tag::Double:
                    inputs[i] = executorch::runtime::EValue(conversions::asType<double>(rt, ctx, val));
                    break;
                case executorch::runtime::Tag::Int:
                    inputs[i] = executorch::runtime::EValue(conversions::asType<int64_t>(rt, ctx, val));
                    break;
                case executorch::runtime::Tag::Bool:
                    inputs[i] = executorch::runtime::EValue(conversions::asType<bool>(rt, ctx, val));
                    break;
                default:
                    throw jsi::JSError(rt, std::format("{}: Unsupported input type", ctx));
                }
            }

            const auto result = getOrThrow(rt, std::format("execute: Method '{}' failed (check getMethodMeta() "
                                                           "for required backends and getRegisteredBackends() "
                                                           "for registered ones)",
                                                           methodName),
                                           self->etModule_->execute(methodName, inputs));

            auto jsOutputArray = jsi::Array(rt, result.size());

            size_t index = 0;
            size_t tensorOutputIdx = 0;

            for (const auto &output : result) {
                switch (output.tag) {
                case executorch::runtime::Tag::None: {
                    jsOutputArray.setValueAtIndex(rt, index, jsi::Value::null());
                    break;
                }
                case executorch::runtime::Tag::Tensor: {
                    if (tensorOutputIdx >= outputTensorsArray.size(rt)) {
                        throw jsi::JSError(rt, "execute: Not enough tensor output placeholders in outputTensors");
                    }

                    auto val = outputTensorsArray.getValueAtIndex(rt, tensorOutputIdx);
                    auto ctx = std::format("execute: outputTensors[{}]", tensorOutputIdx);

                    auto tensorMeta = getOrThrow(rt, std::format("{}: tensor meta", ctx), methodMeta.output_tensor_meta(index));
                    auto expectedDtype = getDTypeOrThrow(rt, ctx, tensorMeta.scalar_type());
                    auto tensorHostObject = tensor::fromJs(rt, ctx, val, expectedDtype, tensorMeta.sizes());

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. The same tensor was passed multiple times.");
                    }
                    tensorLocks.emplace_back(tensor::tryLockUnique(rt, ctx, tensorHostObject));

                    std::memcpy(tensorHostObject->data_.get(), output.toTensor().const_data_ptr(), output.toTensor().nbytes());

                    jsOutputArray.setValueAtIndex(rt, index, jsi::Object::createFromHostObject(rt, tensorHostObject));
                    ++tensorOutputIdx;

                    break;
                }
                case executorch::runtime::Tag::Double: {
                    jsOutputArray.setValueAtIndex(rt, index, output.toDouble());
                    break;
                }
                case executorch::runtime::Tag::Int: {
                    jsOutputArray.setValueAtIndex(rt, index, static_cast<double>(output.toInt()));
                    break;
                }
                case executorch::runtime::Tag::Bool: {
                    jsOutputArray.setValueAtIndex(rt, index, output.toBool());
                    break;
                }
                default: {
                    throw jsi::JSError(rt, "execute: Unsupported return type");
                }
                }

                ++index;
            }

            return jsOutputArray;
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "execute"), 3, fnBody);
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw jsi::JSError(rt, "dispose: Usage: dispose()");
            }

            std::unique_lock<std::mutex> lock(self->mutex_);

            if (!self->etModule_) {
                throw jsi::JSError(rt, "dispose: Model has already been disposed");
            }

            self->etModule_.reset();

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, fnBody);
    }

    return jsi::Value::undefined();
}

std::vector<facebook::jsi::PropNameID> ModelHostObject::getPropertyNames(jsi::Runtime &rt) {
    std::vector<facebook::jsi::PropNameID> properties;
    properties.push_back(jsi::PropNameID::forAscii(rt, "path"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "getMethodNames"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "getMethodMeta"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "execute"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "dispose"));
    return properties;
}

void install_loadModel(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "loadModel";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) {
            throw jsi::JSError(rt, "loadModel: Usage: loadModel(path)");
        }

        auto modelPath = conversions::asType<std::string>(rt, "loadModel: path", args[0]);
        try {
            return jsi::Object::createFromHostObject(rt, std::make_shared<ModelHostObject>(modelPath));
        } catch (const std::exception &e) {
            throw jsi::JSError(rt, std::format("loadModel: {}", e.what()));
        }
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 1, fnBody);

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::core::model
