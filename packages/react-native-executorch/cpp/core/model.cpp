#include "model.h"

#include <array>
#include <chrono>
#include <cstdint>
#include <exception>
#include <format>
#include <optional>
#include <unordered_set>
#include <utility>
#include <vector>

#include "dtype.h"
#include "tensor_helpers.h"

#include <jsi/jsi.h>

#include <executorch/runtime/backend/interface.h>
#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/tag.h>

namespace {
namespace jsi = facebook::jsi;
namespace types = rnexecutorch::core::types;

template <typename T>
T unwrap(jsi::Runtime &rt, const std::string &ctx, executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw jsi::JSError(rt, std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())));
    }
    return std::move(result.get());
}

types::DType
fromScalarType(jsi::Runtime &rt, const std::string &ctx, executorch::aten::ScalarType scalarType) {
    try {
        return types::fromScalarType(scalarType);
    } catch (const std::exception &e) {
        throw jsi::JSError(rt, ctx + ": Unsupported tensor dtype: " + e.what());
    }
}

jsi::Object tensorMetaToJs(jsi::Runtime &rt, const executorch::runtime::TensorInfo &tensorMeta) {
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
}

std::vector<std::array<int64_t, 3>>
parseDynamicDims(executorch::extension::Module &module) {
    std::vector<std::array<int64_t, 3>> bounds;

    auto methodNames = module.method_names();
    if (!methodNames.ok() || !methodNames->contains("get_dynamic_dims")) {
        return bounds;
    }

    auto result = module.execute("get_dynamic_dims");
    if (!result.ok() || result->empty() || !result->at(0).isTensor()) {
        throw std::runtime_error("get_dynamic_dims is present but did not return a tensor");
    }

    const auto boundsTensor = result->at(0).toTensor();
    if (boundsTensor.scalar_type() != executorch::aten::ScalarType::Long || boundsTensor.dim() != 2 ||
        boundsTensor.size(1) != 3) {
        throw std::runtime_error("get_dynamic_dims must return an int64 [D, 3] tensor of "
                                 "[min, max, step] rows");
    }

    const auto *data = boundsTensor.const_data_ptr<int64_t>();
    const auto rows = boundsTensor.size(0);
    bounds.reserve(static_cast<size_t>(rows));
    for (int64_t r = 0; r < rows; ++r) {
        const int64_t minDim = data[r * 3];
        const int64_t maxDim = data[r * 3 + 1];
        const int64_t step = data[r * 3 + 2];
        if (maxDim < minDim || step < 1) {
            throw std::runtime_error(std::format("get_dynamic_dims row {} is invalid: expected "
                                                 "min <= max and step >= 1 but got [{}, {}, {}]",
                                                 r, minDim, maxDim, step));
        }
        bounds.push_back({minDim, maxDim, step});
    }
    return bounds;
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

    if (auto bounds = parseDynamicDims(*etModule_); !bounds.empty()) {
        dynamicInputBounds_.emplace("forward", std::move(bounds));
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

            auto methodNames = unwrap(rt, "getMethodNames", self->etModule_->method_names());

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
            using executorch::runtime::tag_to_string;

            if (count != 1) {
                throw jsi::JSError(rt, "getMethodMeta: Usage: getMethodMeta(methodName)");
            }

            std::unique_lock<std::mutex> lock(self->mutex_, std::try_to_lock);
            if (!lock.owns_lock()) {
                throw jsi::JSError(rt, "getMethodMeta: Model is currently in use");
            }

            if (!self->etModule_) {
                throw jsi::JSError(rt, "getMethodMeta: Model has been disposed");
            }

            auto methodName = conversions::asType<std::string>(rt, "getMethodMeta: methodName", args[0]);
            auto methodMeta = unwrap(rt, "getMethodMeta", self->etModule_->method_meta(methodName));

            auto inputTagsArray = jsi::Array(rt, methodMeta.num_inputs());
            for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
                auto ctx = std::format("getMethodMeta: input tag [{}]", i);
                auto tag = unwrap(rt, ctx, methodMeta.input_tag(i));
                inputTagsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, tag_to_string(tag)));
            }

            auto outputTagsArray = jsi::Array(rt, methodMeta.num_outputs());
            for (size_t i = 0; i < methodMeta.num_outputs(); ++i) {
                auto ctx = std::format("getMethodMeta: output tag [{}]", i);
                auto tag = unwrap(rt, ctx, methodMeta.output_tag(i));
                outputTagsArray.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, tag_to_string(tag)));
            }

            auto usesBackendMap = jsi::Object(rt);
            for (size_t i = 0; i < methodMeta.num_backends(); ++i) {
                auto ctx = std::format("getMethodMeta: backend name [{}]", i);
                const auto *backendName = unwrap(rt, ctx, methodMeta.get_backend_name(i));
                usesBackendMap.setProperty(rt, backendName, methodMeta.uses_backend(backendName));
            }

            auto inputTensorMetaArray = jsi::Array(rt, methodMeta.num_inputs());
            for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
                auto ctx = std::format("getMethodMeta: input tensor meta [{}]", i);
                auto tensorMeta = unwrap(rt, ctx, methodMeta.input_tensor_meta(i));
                inputTensorMetaArray.setValueAtIndex(rt, i, tensorMetaToJs(rt, tensorMeta));
            }

            auto outputTensorMetaArray = jsi::Array(rt, methodMeta.num_outputs());
            for (size_t i = 0; i < methodMeta.num_outputs(); ++i) {
                auto ctx = std::format("getMethodMeta: output tensor meta [{}]", i);
                auto tensorMeta = unwrap(rt, ctx, methodMeta.output_tensor_meta(i));
                outputTensorMetaArray.setValueAtIndex(rt, i, tensorMetaToJs(rt, tensorMeta));
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
            auto methodMeta = unwrap(rt, "execute", self->etModule_->method_meta(methodName));

            auto inputsArray = conversions::asType<jsi::Array>(rt, "execute: inputs", args[1]);
            auto outputTensorsArray = conversions::asType<jsi::Array>(rt, "execute: outputTensors", args[2]);

            if (inputsArray.size(rt) != methodMeta.num_inputs()) {
                throw jsi::JSError(rt, std::format("execute: Incorrect size for inputs: got {}, expected {}",
                                                   inputsArray.size(rt), methodMeta.num_inputs()));
            }

            std::vector<executorch::runtime::EValue> inputs(methodMeta.num_inputs());
            std::vector<std::unique_lock<std::shared_mutex>> tensorLocks;
            std::unordered_set<TensorHostObject *> lockedTensors;

            // Per-dimension [min, max, step] bounds parsed from get_dynamic_dims
            // at construction. Absent for statically shaped methods, which then
            // validate exactly.
            const std::vector<std::array<int64_t, 3>> noBounds;
            auto boundsIt = self->dynamicInputBounds_.find(methodName);
            const auto &dynamicInputBounds =
                boundsIt != self->dynamicInputBounds_.end() ? boundsIt->second : noBounds;
            size_t boundsOffset = 0;

            for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
                auto ctx = std::format("execute: inputs[{}]", i);
                auto tag = unwrap(rt, ctx, methodMeta.input_tag(i));
                auto val = inputsArray.getValueAtIndex(rt, i);

                switch (tag) {
                case executorch::runtime::Tag::Tensor: {
                    auto tensorMeta = unwrap(rt, ctx + ": tensor meta", methodMeta.input_tensor_meta(i));
                    auto expectedDtype = fromScalarType(rt, ctx, tensorMeta.scalar_type());

                    std::shared_ptr<TensorHostObject> tensorHostObject;
                    if (dynamicInputBounds.empty()) {
                        tensorHostObject = tensor::fromJs(rt, ctx, val, expectedDtype, tensorMeta.sizes());
                    } else {
                        // Map bounds by the method-declared rank so mapping is
                        // independent of the caller-supplied shape.
                        const auto rank = tensorMeta.sizes().size();
                        if (boundsOffset + rank > dynamicInputBounds.size()) {
                            throw jsi::JSError(rt, std::format("execute: get_dynamic_dims declares fewer "
                                                               "dimensions ({}) than forward's tensor "
                                                               "inputs require",
                                                               dynamicInputBounds.size()));
                        }
                        tensor::SymbolicShape expectedShape;
                        expectedShape.reserve(rank);
                        for (size_t d = 0; d < rank; ++d) {
                            const auto &row = dynamicInputBounds[boundsOffset + d];
                            tensor::RangeDim rangeDim;
                            rangeDim.min = static_cast<int32_t>(row[0]);
                            rangeDim.max = static_cast<int32_t>(row[1]);
                            if (row[2] > 1) {
                                rangeDim.step = static_cast<int32_t>(row[2]);
                            }
                            expectedShape.emplace_back(rangeDim);
                        }
                        boundsOffset += rank;
                        tensorHostObject = tensor::fromJs(rt, ctx, val, expectedDtype,
                                                          std::optional<tensor::SymbolicShape>(std::move(expectedShape)));
                    }

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. "
                                               "The same tensor was passed multiple times.");
                    }
                    tensorLocks.emplace_back(tensor::tryLockUnique(rt, ctx, tensorHostObject));
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

            if (!dynamicInputBounds.empty() && boundsOffset != dynamicInputBounds.size()) {
                throw jsi::JSError(rt, std::format("execute: get_dynamic_dims declares more dimensions ({}) "
                                                   "than forward's tensor inputs use ({})",
                                                   dynamicInputBounds.size(), boundsOffset));
            }

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

            auto result = unwrap(rt, std::format("execute: Method '{}' failed (check getMethodMeta() "
                                                 "for required backends and getRegisteredBackends() "
                                                 "for registered ones)",
                                                 methodName),
                                 std::move(executeResult));

            auto jsOutputArray = jsi::Array(rt, result.size());
            size_t index = 0;
            size_t tensorOutputIdx = 0;

            for (const auto &output : result) {
                switch (output.tag) {
                case executorch::runtime::Tag::Tensor: {
                    if (tensorOutputIdx >= outputTensorsArray.size(rt)) {
                        throw jsi::JSError(rt, "execute: Not enough tensor output placeholders in outputTensors");
                    }

                    auto ctx = std::format("execute: outputTensors[{}]", tensorOutputIdx);
                    auto val = outputTensorsArray.getValueAtIndex(rt, tensorOutputIdx);

                    auto tensorMeta = unwrap(rt, ctx + ": tensor meta", methodMeta.output_tensor_meta(index));
                    auto expectedDtype = fromScalarType(rt, ctx, tensorMeta.scalar_type());
                    auto tensorHostObject = tensor::fromJs(rt, ctx, val, expectedDtype, tensorMeta.sizes());

                    if (!lockedTensors.insert(tensorHostObject.get()).second) {
                        throw jsi::JSError(rt, "execute: Tensor aliasing detected. "
                                               "The same tensor was passed multiple times.");
                    }
                    tensorLocks.emplace_back(tensor::tryLockUnique(rt, ctx, tensorHostObject));
                    std::memcpy(tensorHostObject->data_.get(),
                                output.toTensor().const_data_ptr(),
                                output.toTensor().nbytes());

                    jsOutputArray.setValueAtIndex(rt, index, val);
                    ++tensorOutputIdx;
                    break;
                }
                case executorch::runtime::Tag::Double:
                    jsOutputArray.setValueAtIndex(rt, index, output.toDouble());
                    break;
                case executorch::runtime::Tag::Int:
                    jsOutputArray.setValueAtIndex(rt, index, static_cast<double>(output.toInt()));
                    break;
                case executorch::runtime::Tag::Bool:
                    jsOutputArray.setValueAtIndex(rt, index, output.toBool());
                    break;
                case executorch::runtime::Tag::None:
                    jsOutputArray.setValueAtIndex(rt, index, jsi::Value::null());
                    break;
                default:
                    throw jsi::JSError(rt, std::format("execute: Unsupported return type: {}",
                                                       executorch::runtime::tag_to_string(output.tag)));
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
