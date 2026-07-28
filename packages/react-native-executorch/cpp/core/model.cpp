#include "model.h"

#include <chrono>
#include <cstdint>
#include <exception>
#include <format>
#include <optional>
#include <unordered_set>
#include <utility>
#include <vector>

#include "dtype.h"
#include "schema.h"
#include "tensor_helpers.h"

#include <jsi/jsi.h>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/tag.h>

namespace {
namespace jsi = facebook::jsi;

template <typename T>
T unwrap(const std::string &ctx, executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw std::runtime_error(std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())));
    }
    return std::move(result.get());
}

template <typename T>
T unwrap(jsi::Runtime &rt, const std::string &ctx, executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw jsi::JSError(rt, std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())));
    }
    return std::move(result.get());
}

} // namespace

namespace rnexecutorch::core::model {
namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;

using rnexecutorch::core::tensor::TensorHostObject;

ModelHostObject::ModelHostObject(const std::string &modelPath)
    : modelPath_(modelPath),
      etModule_(std::make_unique<executorch::extension::Module>(modelPath)) {

    auto error = etModule_->load();
    if (!etModule_->is_loaded()) {
        const std::string errorMsg = executorch::runtime::to_string(error);
        throw std::runtime_error(std::format("Failed to load model: {}", errorMsg));
    }

    const auto methodNames = unwrap("loadModel", etModule_->method_names());
    const auto *const getSchemaMethod = "get_model_schema";
    schema::ModelSpec overrideSpec;

    if (methodNames.contains(getSchemaMethod)) {
        auto ctx = std::format("loadModel: '{}'", getSchemaMethod);
        auto result = unwrap(ctx, etModule_->execute(getSchemaMethod));

        if (result.empty() || result[0].tag != executorch::runtime::Tag::String) {
            throw std::runtime_error(std::format("{} must return a single string value", ctx));
        }

        auto jsonStr = std::string(result[0].toString());
        overrideSpec = schema::parseModelSpecJson(ctx, jsonStr);
    }

    for (const auto &methodName : methodNames) {
        auto methodMeta = unwrap("loadModel", etModule_->method_meta(methodName));
        spec_[methodName] = schema::methodSpecFromMetadata(methodMeta);
        backends_[methodName] = schema::getUsedBackends(methodMeta);

        if (overrideSpec.contains(methodName)) {
            spec_[methodName] = std::move(overrideSpec[methodName]);
        }

        auto ctx = std::format("loadModel: method '{}'", methodName);
        schema::validateSpec(spec_[methodName], methodMeta, ctx);
    }
}

jsi::Value ModelHostObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
    auto nameStr = name.utf8(rt);

    if (nameStr == "path") {
        return jsi::String::createFromUtf8(rt, modelPath_);
    }

    if (nameStr == "schema") {
        return schema::modelSpecToJs(rt, spec_);
    }

    if (nameStr == "backends") {
        return schema::backendsToJs(rt, backends_);
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
            if (!self->spec_.contains(methodName)) {
                throw jsi::JSError(rt, std::format("execute: Unknown method '{}'", methodName));
            }
            const auto &methodSpec = self->spec_.at(methodName);

            auto inputsArray = conversions::asType<jsi::Array>(rt, "execute: inputs", args[1]);
            auto outputTensorsArray = conversions::asType<jsi::Array>(rt, "execute: outputTensors", args[2]);

            if (inputsArray.size(rt) != methodSpec.inputs.size()) {
                throw jsi::JSError(rt, std::format("execute: Incorrect size for inputs"));
            }

            std::vector<executorch::runtime::EValue> inputs(methodSpec.inputs.size());
            std::vector<std::unique_lock<std::shared_mutex>> tensorLocks;
            std::unordered_set<TensorHostObject *> lockedTensors;
            std::vector<std::vector<int32_t>> inputShapes;

            for (size_t i = 0; i < methodSpec.inputs.size(); ++i) {
                auto ctx = std::format("execute: inputs[{}]", i);
                auto tag = methodSpec.inputs[i].tag;
                auto val = inputsArray.getValueAtIndex(rt, i);

                switch (tag) {
                case executorch::runtime::Tag::Tensor: {
                    const auto &tSpec = methodSpec.inputs[i];
                    auto tensorHostObject = tensor::fromJs(rt, ctx, val, tSpec.dtype, tSpec.shape);

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. "
                                               "The same tensor was passed multiple times.");
                    }
                    tensorLocks.emplace_back(tensor::tryLockUnique(rt, ctx, tensorHostObject));
                    inputShapes.push_back(tensorHostObject->shape_);
                    inputs[i] = tensorHostObject->tensor_;
                    break;
                }
                case executorch::runtime::Tag::Double:
                    inputs[i] = conversions::asType<double>(rt, ctx, val);
                    break;
                case executorch::runtime::Tag::Int:
                    inputs[i] = conversions::asType<int64_t>(rt, ctx, val);
                    break;
                case executorch::runtime::Tag::Bool:
                    inputs[i] = conversions::asType<bool>(rt, ctx, val);
                    break;
                case executorch::runtime::Tag::None:
                    inputs[i] = executorch::runtime::EValue();
                    break;
                default:
                    throw jsi::JSError(rt, std::format("{}: Unsupported input type: {}",
                                                       ctx, executorch::runtime::tag_to_string(tag)));
                }
            }

            schema::validateRuntimeConstraints(rt, methodSpec.runtimeConstraints, inputShapes,
                                               std::format("execute: method '{}'", methodName));

            auto startTime = std::chrono::high_resolution_clock::now();
            auto executeResult = self->etModule_->execute(methodName, inputs);
            auto finishTime = std::chrono::high_resolution_clock::now();

#ifdef EXECUTORCH_ENABLE_EXECUTION_PROFILING
            auto durationMs = std::chrono::duration_cast<std::chrono::milliseconds>(finishTime - startTime).count();
            auto consoleObj = conversions::asType<jsi::Object>(rt, "console", rt.global().getProperty(rt, "console"));
            auto logFn = conversions::asType<jsi::Function>(rt, "console.log", consoleObj.getProperty(rt, "log"));
            auto info = std::format("Execution of method '{}' took {} ms", methodName, durationMs);
            logFn.callWithThis(rt, consoleObj, {jsi::String::createFromUtf8(rt, info)});
#endif

            auto result = unwrap(rt, std::format("execute: Method '{}' failed.\n"
                                                 "\n"
                                                 "Common causes:\n"
                                                 "  1. Backend not registered\n"
                                                 "     Ensure backends from `model.backends` are registered\n"
                                                 "     in the ExecuTorch runtime.\n"
                                                 "\n"
                                                 "  2. Shape/constraint mismatch\n"
                                                 "     If the model uses dynamic shapes or runtime constraints\n"
                                                 "     (e.g. equality between dimensions), export a companion\n"
                                                 "     method returning a JSON model spec\n"
                                                 "     (see `src/core/schema.ts` for the JSON structure).\n"
                                                 "\n"
                                                 "     Without it, validation falls back to static metadata\n"
                                                 "     from ExecuTorch which only contains upper bounds and\n"
                                                 "     does not capture runtime constraints.",
                                                 methodName),
                                 std::move(executeResult));

            auto jsOutputArray = jsi::Array(rt, result.size());
            size_t outputIdx = 0;
            size_t tensorOutputIdx = 0;

            for (const auto &output : result) {
                switch (output.tag) {
                case executorch::runtime::Tag::Tensor: {
                    if (tensorOutputIdx >= outputTensorsArray.size(rt)) {
                        throw jsi::JSError(rt, "execute: Not enough tensor output placeholders in outputTensors");
                    }

                    auto ctx = std::format("execute: outputTensors[{}]", tensorOutputIdx);
                    auto val = outputTensorsArray.getValueAtIndex(rt, tensorOutputIdx);

                    auto dtype = types::fromScalarType(output.toTensor().dtype());
                    auto shape = output.toTensor().sizes();
                    auto tensorHostObject = tensor::fromJs(rt, ctx, val, dtype, shape);

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. "
                                               "The same tensor was passed multiple times.");
                    }
                    tensorLocks.emplace_back(tensor::tryLockUnique(rt, ctx, tensorHostObject));
                    std::memcpy(tensorHostObject->data_.get(),
                                output.toTensor().const_data_ptr(),
                                output.toTensor().nbytes());

                    jsOutputArray.setValueAtIndex(rt, outputIdx, val);
                    ++tensorOutputIdx;
                    break;
                }
                case executorch::runtime::Tag::Double:
                    jsOutputArray.setValueAtIndex(rt, outputIdx, output.toDouble());
                    break;
                case executorch::runtime::Tag::Int:
                    jsOutputArray.setValueAtIndex(rt, outputIdx, static_cast<double>(output.toInt()));
                    break;
                case executorch::runtime::Tag::Bool:
                    jsOutputArray.setValueAtIndex(rt, outputIdx, output.toBool());
                    break;
                case executorch::runtime::Tag::None:
                    jsOutputArray.setValueAtIndex(rt, outputIdx, jsi::Value::null());
                    break;
                case executorch::runtime::Tag::String:
                    jsOutputArray.setValueAtIndex(rt, outputIdx, jsi::String::createFromUtf8(rt, std::string(output.toString())));
                    break;
                default:
                    throw jsi::JSError(rt, std::format("execute: Unsupported return type: {}",
                                                       executorch::runtime::tag_to_string(output.tag)));
                }

                ++outputIdx;
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
    properties.push_back(jsi::PropNameID::forAscii(rt, "schema"));
    properties.push_back(jsi::PropNameID::forAscii(rt, "backends"));
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
