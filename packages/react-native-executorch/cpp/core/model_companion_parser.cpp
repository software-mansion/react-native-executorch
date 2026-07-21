#include "model_companion_parser.h"

#include <cstddef>
#include <cstdint>
#include <format>
#include <optional>
#include <stdexcept>
#include <string>
#include <vector>

#include <executorch/runtime/core/tag.h>

namespace {

template <typename T>
T unwrap(const std::string &ctx, executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw std::runtime_error(
            std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())));
    }
    return std::move(result.get());
}

} // namespace

namespace rnexecutorch::core::model {

std::optional<std::vector<tensor::ShapeConstraint>>
parseDynamicInputShapes(executorch::extension::Module &module, const std::string &methodName) {
    using executorch::aten::ScalarType;

    const auto getDynamicShapesMethodName = std::format("get_dynamic_dims_{}", methodName);
    const auto ctx = getDynamicShapesMethodName + ": ";

    auto methodNames = unwrap(ctx + "failed to get method names", module.method_names());
    if (methodName == getDynamicShapesMethodName ||
        !methodNames.contains(getDynamicShapesMethodName)) {
        return std::nullopt;
    }

    auto methodMeta = unwrap(std::format("{}failed to get meta for method '{}'", ctx, methodName),
                             module.method_meta(methodName));

    size_t expectedTensorInputs = 0;
    for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
        auto tag = unwrap(std::format("{}failed to get tag for input [{}]", ctx, i), methodMeta.input_tag(i));
        if (tag == executorch::runtime::Tag::Tensor) {
            expectedTensorInputs++;
        }
    }

    auto result = unwrap(ctx + "failed to execute", module.execute(getDynamicShapesMethodName));
    if (result.size() != expectedTensorInputs) {
        throw std::runtime_error(std::format("{}number of outputs returned ({}) does not match the number of "
                                             "tensor inputs declared by method '{}' ({})",
                                             ctx, result.size(), methodName, expectedTensorInputs));
    }

    std::vector<tensor::ShapeConstraint> dynamicShapes;
    dynamicShapes.reserve(methodMeta.num_inputs());
    size_t tensorIndex = 0;

    for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
        auto tag = unwrap(std::format("{}failed to get tag for input [{}]", ctx, i),
                          methodMeta.input_tag(i));

        if (tag != executorch::runtime::Tag::Tensor) {
            dynamicShapes.emplace_back();
            continue;
        }

        const auto &out = result.at(tensorIndex);
        if (!out.isTensor()) {
            throw std::runtime_error(std::format("{}output[{}] is not a tensor", ctx, tensorIndex));
        }

        auto inputMeta = unwrap(std::format("{}failed to get tensor meta for input [{}]", ctx, i),
                                methodMeta.input_tensor_meta(i));
        const auto rank = inputMeta.sizes().size();
        const auto shapeTensor = out.toTensor();

        if (shapeTensor.dim() != 2 || shapeTensor.size(1) != 3 ||
            shapeTensor.size(0) != static_cast<ssize_t>(rank) ||
            shapeTensor.scalar_type() != ScalarType::Int) {
            throw std::runtime_error(std::format("{}output[{}] expected to be a 2D int32_t tensor of shape [{}, 3]",
                                                 ctx, tensorIndex, rank));
        }

        const auto *shape = shapeTensor.const_data_ptr<int32_t>();
        tensor::SymbolicShape symbolicShape;
        symbolicShape.reserve(rank);

        for (size_t axis = 0; axis < rank; ++axis) {
            const auto minDim = shape[axis * 3 + 0];
            const auto maxDim = shape[axis * 3 + 1];
            const auto step = shape[axis * 3 + 2];
            if (minDim < 0 || maxDim < minDim || step < 1) {
                throw std::runtime_error(std::format("{}output[{}], axis {} is invalid: "
                                                     "expected 0 <= min <= max and step >= 1 but got [{}, {}, {}]",
                                                     ctx, tensorIndex, axis, minDim, maxDim, step));
            }
            if (maxDim > inputMeta.sizes()[axis]) {
                throw std::runtime_error(std::format("{}output[{}], axis {} max dimension ({}) "
                                                     "exceeds model metadata upper limit ({})",
                                                     ctx, tensorIndex, axis, maxDim, inputMeta.sizes()[axis]));
            }

            symbolicShape.emplace_back(tensor::RangeDim{.min = minDim, .max = maxDim, .step = step});
        }

        dynamicShapes.emplace_back(std::move(symbolicShape));
        ++tensorIndex;
    }

    return dynamicShapes;
}

std::optional<std::vector<tensor::ShapeConstraint>>
parseEnumeratedInputShapes(executorch::extension::Module &module, const std::string &methodName) {
    using executorch::aten::ScalarType;

    const auto getEnumeratedShapesMethodName = std::format("get_enumerated_dims_{}", methodName);
    const auto ctx = getEnumeratedShapesMethodName + ": ";

    auto methodNames = unwrap(ctx + "failed to get method names", module.method_names());
    if (methodName == getEnumeratedShapesMethodName ||
        !methodNames.contains(getEnumeratedShapesMethodName)) {
        return std::nullopt;
    }

    auto methodMeta = unwrap(std::format("{}failed to get meta for method '{}'", ctx, methodName),
                             module.method_meta(methodName));

    size_t expectedTensorInputs = 0;
    for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
        auto tag = unwrap(std::format("{}failed to get tag for input [{}]", ctx, i),
                          methodMeta.input_tag(i));
        if (tag == executorch::runtime::Tag::Tensor) {
            expectedTensorInputs++;
        }
    }

    auto result = unwrap(ctx + "failed to execute", module.execute(getEnumeratedShapesMethodName));
    if (result.size() != expectedTensorInputs) {
        throw std::runtime_error(std::format("{}number of outputs returned ({}) does not match the number of "
                                             "tensor inputs declared by method '{}' ({})",
                                             ctx, result.size(), methodName, expectedTensorInputs));
    }

    std::vector<tensor::ShapeConstraint> enumeratedShapes;
    enumeratedShapes.reserve(methodMeta.num_inputs());
    size_t tensorIndex = 0;

    for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
        auto tag = unwrap(std::format("{}failed to get tag for input [{}]", ctx, i),
                          methodMeta.input_tag(i));

        if (tag != executorch::runtime::Tag::Tensor) {
            enumeratedShapes.emplace_back();
            continue;
        }

        const auto &out = result.at(tensorIndex);
        if (!out.isTensor()) {
            throw std::runtime_error(std::format("{}output[{}] is not a tensor", ctx, tensorIndex));
        }

        auto inputMeta = unwrap(std::format("{}failed to get tensor meta for input [{}]", ctx, i),
                                methodMeta.input_tensor_meta(i));
        const auto rank = inputMeta.sizes().size();
        const auto shapeTensor = out.toTensor();

        if (shapeTensor.dim() != 2 ||
            shapeTensor.size(1) != static_cast<ssize_t>(rank) ||
            shapeTensor.scalar_type() != ScalarType::Int) {
            throw std::runtime_error(std::format("{}output[{}] expected to be a 2D int32_t tensor of shape [num_shapes, {}]",
                                                 ctx, tensorIndex, rank));
        }

        const auto numShapes = static_cast<size_t>(shapeTensor.size(0));
        const auto *shapeData = shapeTensor.const_data_ptr<int32_t>();
        std::vector<tensor::SymbolicShape> alternatives;
        alternatives.reserve(numShapes);

        for (size_t s = 0; s < numShapes; ++s) {
            tensor::SymbolicShape singleShape;
            singleShape.reserve(rank);
            for (size_t axis = 0; axis < rank; ++axis) {
                const auto dimVal = shapeData[s * rank + axis];
                if (dimVal < 0) {
                    throw std::runtime_error(std::format("{}output[{}], shape {}, axis {} is invalid: "
                                                         "dimension cannot be negative ({})",
                                                         ctx, tensorIndex, s, axis, dimVal));
                }
                singleShape.emplace_back(dimVal);
            }
            alternatives.push_back(std::move(singleShape));
        }

        enumeratedShapes.emplace_back(std::move(alternatives));
        ++tensorIndex;
    }

    return enumeratedShapes;
}

} // namespace rnexecutorch::core::model
