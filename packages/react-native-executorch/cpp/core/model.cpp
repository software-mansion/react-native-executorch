#include "model.h"
#include "dtype.h"
#include "tensor.h"

#include <chrono>
#include <unordered_set>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/tag.h>

namespace rnexecutorch::core::model {
namespace jsi = facebook::jsi;
using TensorHostObject = rnexecutorch::core::tensor::TensorHostObject;

ModelHostObject::ModelHostObject(const std::string &modelPath)
    : modelPath_(modelPath),
      etModule_(std::make_unique<executorch::extension::Module>(modelPath)) {
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

            auto methodNames = self->etModule_->method_names();
            if (!methodNames.ok()) {
                const std::string errorMsg = executorch::runtime::to_string(methodNames.error());
                throw jsi::JSError(rt, "getMethodNames: Failed to get method names: " + errorMsg);
            }

            auto jsArray = jsi::Array(rt, methodNames->size());
            size_t index = 0;
            for (const auto &methodName : methodNames.get()) {
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
                throw jsi::JSError(rt, "getMethodMeta: Expected arg0 to be a string");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "getMethodMeta: Model is currently in use");
            }

            if (!self->etModule_) {
                throw jsi::JSError(rt, "getMethodMeta: Model has been disposed");
            }

            auto methodName = args[0].asString(rt).utf8(rt);
            auto methodMeta = self->etModule_->method_meta(methodName);
            if (!methodMeta.ok()) {
                const std::string errorMsg = executorch::runtime::to_string(methodMeta.error());
                throw jsi::JSError(rt, "getMethodMeta: Failed to get method meta: " + errorMsg);
            }

            auto inputTagsArray = jsi::Array(rt, methodMeta->num_inputs());
            for (size_t i = 0; i < methodMeta->num_inputs(); ++i) {
                auto tag = methodMeta->input_tag(i);
                if (!tag.ok()) {
                    const std::string errorMsg = executorch::runtime::to_string(tag.error());
                    throw jsi::JSError(rt, "getMethodMeta: Failed to get input tag for input " + std::to_string(i) + ": " + errorMsg);
                }
                inputTagsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, executorch::runtime::tag_to_string(tag.get())));
            }

            auto outputTagsArray = jsi::Array(rt, methodMeta->num_outputs());
            for (size_t i = 0; i < methodMeta->num_outputs(); ++i) {
                auto tag = methodMeta->output_tag(i);
                if (!tag.ok()) {
                    const std::string errorMsg = executorch::runtime::to_string(tag.error());
                    throw jsi::JSError(rt, "getMethodMeta: Failed to get output tag for output " + std::to_string(i) + ": " + errorMsg);
                }
                outputTagsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, executorch::runtime::tag_to_string(tag.get())));
            }

            auto usesBackendMap = jsi::Object(rt);
            for (size_t i = 0; i < methodMeta->num_backends(); ++i) {
                auto backendName = methodMeta->get_backend_name(i);
                if (!backendName.ok()) {
                    const std::string errorMsg = executorch::runtime::to_string(backendName.error());
                    throw jsi::JSError(rt, "getMethodMeta: Failed to get backend name for backend " + std::to_string(i) + ": " + errorMsg);
                }
                usesBackendMap.setProperty(rt, backendName.get(), methodMeta->uses_backend(backendName.get()));
            }

            auto tensorMetaToJS = [](jsi::Runtime &rt, const executorch::runtime::TensorInfo &tensorMeta) -> jsi::Object {
                auto jsTensorMeta = jsi::Object(rt);
                jsTensorMeta.setProperty(rt, "name", jsi::String::createFromUtf8(rt, std::string(tensorMeta.name())));
                jsTensorMeta.setProperty(rt, "ndim", static_cast<double>(tensorMeta.sizes().size()));
                jsTensorMeta.setProperty(rt, "nbytes", static_cast<double>(tensorMeta.nbytes()));

                try {
                    const std::string dtypeStr = rnexecutorch::core::types::toString(rnexecutorch::core::types::fromScalarType(tensorMeta.scalar_type()));
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

            auto inputTensorMetaArray = jsi::Array(rt, methodMeta->num_inputs());
            for (size_t i = 0; i < methodMeta->num_inputs(); ++i) {
                auto tensorMeta = methodMeta->input_tensor_meta(i);
                if (!tensorMeta.ok()) {
                    const std::string errorMsg = executorch::runtime::to_string(tensorMeta.error());
                    throw jsi::JSError(rt, "getMethodMeta: Failed to get tensor meta for input " + std::to_string(i) + ": " + errorMsg);
                }
                inputTensorMetaArray.setValueAtIndex(rt, i, tensorMetaToJS(rt, tensorMeta.get()));
            }

            auto outputTensorMetaArray = jsi::Array(rt, methodMeta->num_outputs());
            for (size_t i = 0; i < methodMeta->num_outputs(); ++i) {
                auto tensorMeta = methodMeta->output_tensor_meta(i);
                if (!tensorMeta.ok()) {
                    const std::string errorMsg = executorch::runtime::to_string(tensorMeta.error());
                    throw jsi::JSError(rt, "getMethodMeta: Failed to get tensor meta for output " + std::to_string(i) + ": " + errorMsg);
                }
                outputTensorMetaArray.setValueAtIndex(rt, i, tensorMetaToJS(rt, tensorMeta.get()));
            }

            auto jsMeta = jsi::Object(rt);

            jsMeta.setProperty(rt, "name", jsi::String::createFromUtf8(rt, methodMeta->name()));
            jsMeta.setProperty(rt, "numInputs", static_cast<double>(methodMeta->num_inputs()));
            jsMeta.setProperty(rt, "numOutputs", static_cast<double>(methodMeta->num_outputs()));
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

            if (!args[0].isString()) {
                throw jsi::JSError(rt, "execute: Expected arg0 to be a string");
            }

            if (!args[1].isObject() || !args[1].asObject(rt).isArray(rt)) {
                throw jsi::JSError(rt, "execute: Expected arg1 to be an array");
            }

            if (!args[2].isObject() || !args[2].asObject(rt).isArray(rt)) {
                throw jsi::JSError(rt, "execute: Expected arg2 to be an array");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "execute: Model is currently in use");
            }

            if (!self->etModule_) {
                throw jsi::JSError(rt, "execute: Model has been disposed");
            }

            auto methodName = args[0].asString(rt).utf8(rt);
            auto methodMeta = self->etModule_->method_meta(methodName);
            auto inputsArray = args[1].asObject(rt).asArray(rt);

            if (!methodMeta.ok()) {
                const std::string errorMsg = executorch::runtime::to_string(methodMeta.error());
                throw jsi::JSError(rt, "execute: Failed to get method meta for '" + methodName + "': " + errorMsg);
            }

            if (inputsArray.size(rt) != methodMeta->num_inputs()) {
                const std::string errorMsg = "execute: Incorrect size for inputs: got " +
                                             std::to_string(inputsArray.size(rt)) +
                                             ", expected " + std::to_string(methodMeta->num_inputs());
                throw jsi::JSError(rt, errorMsg);
            }

            auto validateTensor = [](jsi::Runtime &rt,
                                     const TensorHostObject *tensorHostObject,
                                     const executorch::runtime::Result<executorch::runtime::TensorInfo> &tensorMeta,
                                     const std::string &identifier) {
                if (tensorMeta->scalar_type() != tensorHostObject->tensor_->dtype()) {
                    throw jsi::JSError(rt, "execute: Tensor dtype mismatch for " + identifier);
                }

                if (tensorMeta->sizes().size() != tensorHostObject->shape_.size()) {
                    throw jsi::JSError(rt, "execute: Tensor rank mismatch for " + identifier +
                                               ": expected rank " + std::to_string(tensorMeta->sizes().size()) +
                                               " but got " + std::to_string(tensorHostObject->shape_.size()));
                }

                auto ndim = tensorHostObject->tensor_->sizes().size();
                for (size_t j = 0; j < ndim; ++j) {
                    if (tensorMeta->sizes()[j] != tensorHostObject->shape_[j]) {
                        throw jsi::JSError(rt, "execute: Tensor shape mismatch for " + identifier +
                                                   ": expected dimension " + std::to_string(j) + " to be " +
                                                   std::to_string(tensorMeta->sizes()[j]) + " but got " +
                                                   std::to_string(tensorHostObject->shape_[j]));
                    }
                }
            };

            auto inputs = std::vector<executorch::runtime::EValue>(methodMeta->num_inputs());
            std::vector<std::unique_lock<std::shared_mutex>> tensorLocks;
            std::unordered_set<TensorHostObject *> lockedTensors;

            for (size_t i = 0; i < methodMeta->num_inputs(); ++i) {
                auto tag = methodMeta->input_tag(i);
                auto val = inputsArray.getValueAtIndex(rt, i);

                if (!tag.ok()) {
                    const std::string errorMsg = executorch::runtime::to_string(tag.error());
                    throw jsi::JSError(rt, "execute: Failed to get input tag for inputs[" +
                                               std::to_string(i) + "]: " + errorMsg);
                }

                switch (tag.get()) {
                case executorch::runtime::Tag::None: {
                    if (!val.isNull()) {
                        throw jsi::JSError(rt, "execute: Expected inputs[" +
                                                   std::to_string(i) + "] to be null");
                    }
                    inputs[i] = executorch::runtime::EValue();
                    break;
                }
                case executorch::runtime::Tag::Tensor: {
                    if (!val.isObject() || !val.asObject(rt).isHostObject<TensorHostObject>(rt)) {
                        throw jsi::JSError(rt, "execute: Expected inputs[" +
                                                   std::to_string(i) + "] to be a TensorHostObject");
                    }

                    auto tensorHostObject = val.asObject(rt).getHostObject<TensorHostObject>(rt);
                    if (!tensorHostObject->data_) {
                        throw jsi::JSError(rt, "execute: inputs[" + std::to_string(i) + "] has been disposed");
                    }

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. The same tensor was passed multiple times.");
                    }

                    tensorLocks.emplace_back(tensorHostObject->mutex_, std::try_to_lock);
                    if (!tensorLocks.back().owns_lock()) {
                        throw jsi::JSError(rt, "execute: inputs[" + std::to_string(i) +
                                                   "] is currently in use");
                    }

                    auto tensorMeta = methodMeta->input_tensor_meta(i);

                    if (!tensorMeta.ok()) {
                        const std::string errorMsg = executorch::runtime::to_string(tensorMeta.error());
                        throw jsi::JSError(rt, "execute: Failed to get tensor meta for inputs[" +
                                                   std::to_string(i) + "]: " + errorMsg);
                    }

                    validateTensor(rt, tensorHostObject.get(), tensorMeta, "inputs[" + std::to_string(i) + "]");

                    inputs[i] = tensorHostObject->tensor_;
                    break;
                }
                case executorch::runtime::Tag::Double: {
                    if (!val.isNumber()) {
                        throw jsi::JSError(rt, "execute: Expected inputs[" +
                                                   std::to_string(i) + "] to be a number");
                    }
                    inputs[i] = executorch::runtime::EValue(val.asNumber());
                    break;
                }
                case executorch::runtime::Tag::Int: {
                    if (!val.isNumber()) {
                        throw jsi::JSError(rt, "execute: Expected inputs[" +
                                                   std::to_string(i) + "] to be a number");
                    }
                    inputs[i] = executorch::runtime::EValue(static_cast<int64_t>(val.asNumber()));
                    break;
                }
                case executorch::runtime::Tag::Bool: {
                    if (!val.isBool()) {
                        throw jsi::JSError(rt, "execute: Expected inputs[" +
                                                   std::to_string(i) + "] to be a boolean");
                    }
                    inputs[i] = executorch::runtime::EValue(val.asBool());
                    break;
                }
                default: {
                    throw jsi::JSError(rt, "execute: Unsupported input type for inputs[" + std::to_string(i) + "]");
                }
                }
            }

            auto startTime = std::chrono::high_resolution_clock::now();
            auto result = self->etModule_->execute(methodName, inputs);
            auto finishTime = std::chrono::high_resolution_clock::now();

#ifdef EXECUTORCH_ENABLE_EXECUTION_PROFILING
            auto durationMs = std::chrono::duration_cast<std::chrono::milliseconds>(finishTime - startTime).count();
            auto consoleObj = rt.global().getProperty(rt, "console").asObject(rt);
            auto logFn = consoleObj.getProperty(rt, "log").asObject(rt).asFunction(rt);
            auto info = "Execution of method '" + methodName + "' took " + std::to_string(durationMs) + " ms";
            logFn.callWithThis(rt, consoleObj, {jsi::String::createFromUtf8(rt, info)});
#endif

            if (!result.ok()) {
                const std::string errorMsg = executorch::runtime::to_string(result.error());
                throw jsi::JSError(rt, "execute: Method '" + methodName + "' execution failed: " + errorMsg +
                                           ". This may be due to missing required backends - use getMethodMeta()" +
                                           " to check required backends and getExecuTorchRegisteredBackends()" +
                                           " to check which backends are registered in the runtime.");
            }

            auto outputTensorsArray = args[2].asObject(rt).asArray(rt);
            auto jsOutputArray = jsi::Array(rt, result->size());

            size_t index = 0;
            size_t tensorOutputIdx = 0;

            for (const auto &output : result.get()) {
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
                    if (!val.isObject() || !val.asObject(rt).isHostObject<TensorHostObject>(rt)) {
                        throw jsi::JSError(rt, "execute: Expected outputTensors[" +
                                                   std::to_string(tensorOutputIdx) + "] to be a TensorHostObject");
                    }

                    auto tensorHostObject = val.asObject(rt).getHostObject<TensorHostObject>(rt);
                    if (!tensorHostObject->data_) {
                        throw jsi::JSError(rt, "execute: outputTensors[" + std::to_string(tensorOutputIdx) + "] has been disposed");
                    }

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. The same tensor was passed multiple times.");
                    }

                    tensorLocks.emplace_back(tensorHostObject->mutex_, std::try_to_lock);
                    if (!tensorLocks.back().owns_lock()) {
                        throw jsi::JSError(rt, "execute: outputTensors[" +
                                                   std::to_string(tensorOutputIdx) +
                                                   "] is currently in use");
                    }

                    auto tensorMeta = methodMeta->output_tensor_meta(index);

                    if (!tensorMeta.ok()) {
                        const std::string errorMsg = executorch::runtime::to_string(tensorMeta.error());
                        throw jsi::JSError(rt, "execute: Failed to get tensor meta for output at index " +
                                                   std::to_string(index) + ": " + errorMsg);
                    }

                    validateTensor(rt, tensorHostObject.get(), tensorMeta, "outputTensors[" + std::to_string(tensorOutputIdx) + "]");

                    std::memcpy(tensorHostObject->data_.get(),
                                output.toTensor().const_data_ptr(),
                                output.toTensor().nbytes());

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

    if (nameStr == "unloadMethod") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1) {
                throw jsi::JSError(rt, "unloadMethod: Usage: unloadMethod(methodName)");
            }

            if (!args[0].isString()) {
                throw jsi::JSError(rt, "unloadMethod: Expected arg0 to be a string");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "unloadMethod: Model is currently in use");
            }

            if (!self->etModule_) {
                throw jsi::JSError(rt, "unloadMethod: Model has been disposed");
            }

            // Free a single previously-executed method's planned-memory activation
            // arena (and, on graph-compiling backends like CoreML, its compiled
            // graph). The method transparently reloads on next execute. Returns
            // whether a loaded method was actually freed (false = not loaded, a
            // harmless no-op). Bounds memory when many distinct bucketed methods
            // (detect_<S>/recognize_<W>) accumulate over a session.
            auto methodName = args[0].asString(rt).utf8(rt);
            bool unloaded = self->etModule_->unload_method(methodName);
            return jsi::Value(unloaded);
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "unloadMethod"), 1, fnBody);
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
    properties.push_back(jsi::PropNameID::forAscii(rt, "unloadMethod"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "dispose"));
    return properties;
}

void install_loadModel(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "loadModel";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 1) {
            throw jsi::JSError(rt, "loadModel: Usage: loadModel(arg0)");
        }

        if (!args[0].isString()) {
            throw jsi::JSError(rt, "loadModel: Expected arg0 to be a string");
        }

        auto modelPath = args[0].asString(rt).utf8(rt);
        auto modelInstance = std::make_shared<ModelHostObject>(modelPath);

        auto error = modelInstance->etModule_->load();
        if (!modelInstance->etModule_->is_loaded()) {
            const std::string errorMsg = executorch::runtime::to_string(error);
            throw jsi::JSError(rt, "loadModel: Failed to load model: " + errorMsg);
        }

        return jsi::Object::createFromHostObject(rt, modelInstance);
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 1, fnBody);

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::core::model
