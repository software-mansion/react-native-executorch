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
#include "error.h"
#include "schema.h"
#include "tensor_helpers.h"

#include <jsi/jsi.h>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/tag.h>

namespace {

using rnexecutorch::core::error::RnExecuTorchErrorCode;
using rnexecutorch::core::error::RnExecuTorchException;

template <typename T>
T unwrap(RnExecuTorchErrorCode code, const std::string &ctx, executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw RnExecuTorchException(code,
                                    std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())),
                                    result.error());
    }
    return std::move(result.get());
}

void unwrap(RnExecuTorchErrorCode code, const std::string &ctx, executorch::runtime::Error error) {
    if (error != executorch::runtime::Error::Ok) {
        throw RnExecuTorchException(code, std::format("{}: {}", ctx, executorch::runtime::to_string(error)), error);
    }
}

} // namespace

namespace rnexecutorch::core::model {
namespace jsi = facebook::jsi;
namespace conversions = rnexecutorch::core::conversions;

using rnexecutorch::core::tensor::TensorHostObject;

ModelHostObject::ModelHostObject(const std::string &modelPath, const bool eagerLoadMethods)
    : modelPath_(modelPath),
      etModule_(std::make_unique<executorch::extension::Module>(modelPath)) {

    auto loadError = etModule_->load();
    if (!etModule_->is_loaded()) {
        const std::string errorMsg = executorch::runtime::to_string(loadError);
        throw error::LoadFailed(std::format("Failed to load model from '{}': {}", modelPath_, errorMsg),
                                loadError);
    }

    const auto methodNames = unwrap(RnExecuTorchErrorCode::LoadFailed, "method names", etModule_->method_names());
    schema::ModelSpec overrideSpec;

    if (methodNames.contains(kGetModelSchemaMethod)) {
        auto ctx = std::format("Execute '{}'", kGetModelSchemaMethod);
        auto result = unwrap(RnExecuTorchErrorCode::LoadFailed, ctx, etModule_->execute(kGetModelSchemaMethod));

        if (result.empty() || result[0].tag != executorch::runtime::Tag::String) {
            throw error::SchemaMismatch(std::format("{} must return a single string value", ctx));
        }

        auto jsonStr = std::string(result[0].toString());
        overrideSpec = schema::parseModelSpecJson(ctx, jsonStr);
    }

    for (const auto &methodName : methodNames) {
        if (eagerLoadMethods && methodName != kGetModelSchemaMethod) {
            auto ctx = std::format("Load method '{}'", methodName);
            unwrap(RnExecuTorchErrorCode::LoadFailed, ctx, etModule_->load_method(methodName));
        }

        auto ctx = std::format("Method '{}'", methodName);
        auto methodMeta = unwrap(RnExecuTorchErrorCode::LoadFailed, ctx, etModule_->method_meta(methodName));

        spec_[methodName] = schema::methodSpecFromMetadata(methodMeta);
        backends_[methodName] = schema::getUsedBackends(methodMeta);

        if (overrideSpec.contains(methodName)) {
            spec_[methodName] = std::move(overrideSpec[methodName]);
        }

        schema::validateSpec(spec_[methodName], methodMeta, ctx + " metadata validation");
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
                throw error::InvalidArgument("execute: Usage: execute(methodName, inputs, outputTensors)");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw error::ResourceBusy("execute: Model is currently in use");
            }

            if (!self->etModule_) {
                throw error::ResourceDisposed("execute: Model has been disposed");
            }

            auto methodName = conversions::asType<std::string>(rt, "execute: methodName", args[0]);
            if (!self->spec_.contains(methodName)) {
                throw error::InvalidArgument(std::format("execute: Unknown method '{}'", methodName));
            }
            const auto &methodSpec = self->spec_.at(methodName);

            auto inputsArray = conversions::asType<jsi::Array>(rt, "execute: inputs", args[1]);
            auto outputTensorsArray = conversions::asType<jsi::Array>(rt, "execute: outputTensors", args[2]);

            if (inputsArray.size(rt) != methodSpec.inputs.size()) {
                throw error::InvalidArgument(std::format("execute: Incorrect size for inputs of method '{}': got {}, expected {}",
                                                         methodName, inputsArray.size(rt), methodSpec.inputs.size()));
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
                        throw error::InvalidArgument("execute: Tensor aliasing detected. "
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
                    throw error::InvalidArgument(std::format("{}: Unsupported input type: {}",
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

            auto result = unwrap(RnExecuTorchErrorCode::ExecutionFailed,
                                 std::format("execute: Method '{}' failed.\n"
                                             "\n"
                                             "Common causes:\n"
                                             "  1. Backend not registered\n"
                                             "     Ensure backends from `model.backends` are registered\n"
                                             "     in the ExecuTorch runtime\n"
                                             "     (use `getRegisteredBackends()` to check registered backends).\n"
                                             "\n"
                                             "  2. Shape/constraint mismatch\n"
                                             "     If the model uses dynamic shapes or runtime constraints\n"
                                             "     (e.g. equality between dimensions), export a companion\n"
                                             "     method returning a JSON model spec\n"
                                             "     (see `src/core/schema.ts` for the JSON structure).\n"
                                             "     Without it, validation falls back to static metadata\n"
                                             "     from ExecuTorch which only contains upper bounds and\n"
                                             "     does not capture runtime constraints.\n"
                                             "\n"
                                             "  3. Bad model export\n"
                                             "     The model export itself might be broken or invalid.\n"
                                             "\n"
                                             "Error",
                                             methodName),
                                 std::move(executeResult));

            auto jsOutputArray = jsi::Array(rt, result.size());
            size_t outputIdx = 0;
            size_t tensorOutputIdx = 0;

            for (const auto &output : result) {
                switch (output.tag) {
                case executorch::runtime::Tag::Tensor: {
                    if (tensorOutputIdx >= outputTensorsArray.size(rt)) {
                        throw error::InvalidArgument(std::format("execute: Not enough tensor output placeholders in outputTensors"
                                                                 " (provided {}, expected at least {})",
                                                                 outputTensorsArray.size(rt), tensorOutputIdx + 1));
                    }

                    auto ctx = std::format("execute: outputTensors[{}]", tensorOutputIdx);
                    auto val = outputTensorsArray.getValueAtIndex(rt, tensorOutputIdx);

                    auto dtype = types::dtypeFromScalarType(output.toTensor().dtype());
                    auto shape = output.toTensor().sizes();
                    auto tensorHostObject = tensor::fromJs(rt, ctx, val, dtype, shape);

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw error::InvalidArgument("execute: Tensor aliasing detected. "
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
                    throw error::ExecutionFailed(std::format("execute: Unsupported return type: {}",
                                                             executorch::runtime::tag_to_string(output.tag)));
                }

                ++outputIdx;
            }

            return jsOutputArray;
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "execute"), 3, error::guarded(fnBody));
    }

    if (nameStr == "dispose") {
        auto self = shared_from_this();
        auto fnBody = [self](jsi::Runtime & /*rt*/, const jsi::Value & /*thisVal*/, const jsi::Value * /*args*/, size_t count) -> jsi::Value {
            if (count != 0) {
                throw error::InvalidArgument("dispose: Usage: dispose()");
            }

            std::unique_lock<std::mutex> lock(self->mutex_);

            if (!self->etModule_) {
                throw error::ResourceDisposed("dispose: Model has already been disposed");
            }

            self->etModule_.reset();

            return jsi::Value::undefined();
        };
        return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "dispose"), 0, error::guarded(fnBody));
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
        if (count < 1 || count > 2) {
            throw error::InvalidArgument("loadModel: Usage: loadModel(path, options?)");
        }

        auto modelPath = conversions::asType<std::string>(rt, "loadModel: path", args[0]);
        bool eagerLoadMethods = true;

        if (count >= 2 && !args[1].isUndefined() && !args[1].isNull()) {
            auto options = conversions::asType<jsi::Object>(rt, "loadModel: options", args[1]);
            eagerLoadMethods = conversions::getOptionalProperty<bool>(rt, "loadModel: options", options, "eagerLoadMethods").value_or(true);
        }

        return jsi::Object::createFromHostObject(rt, std::make_shared<ModelHostObject>(modelPath, eagerLoadMethods));
    };
    auto fn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 2, error::guarded(fnBody));

    module.setProperty(rt, name, fn);
}
} // namespace rnexecutorch::core::model
