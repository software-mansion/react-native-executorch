#pragma once

#include <optional>
#include <string>
#include <vector>

#include "tensor_helpers.h"

#include <executorch/extension/module/module.h>

namespace rnexecutorch::core::model {

/**
 * Parses compile-time dynamic dimension constraints for the inputs of a module
 * method.
 *
 * @note This is a temporary workaround. ExecuTorch (.pte) model metadata
 * natively serializes only the static upper-bound limits of dynamic/symbolic
 * dimensions, and does not expose the active dynamic range (min, max, step) at
 * runtime.
 *
 * To use this feature, the .pte model must be exported with a companion method
 * named "get_dynamic_dims_<methodName>" (e.g., "get_dynamic_dims_forward").
 *
 * Python export requirements:
 * 1. The companion method must take no arguments.
 * 2. It must return a list of outputs matching the number of Tag::Tensor inputs
 *    of the target method (scalar inputs are excluded).
 * 3. Each output must be a 2D int32 tensor of shape [rank, 3], where each row
 *    represents [min, max, step] constraints for the corresponding dimension of
 *    that input tensor.
 *
 * @param module The ExecuTorch extension module to query.
 * @param methodName The name of the target module method (e.g. "forward").
 * @return A vector of SymbolicShape objects, or std::nullopt if the companion
 *         method is not defined. If returned, the vector's size is guaranteed
 *         to equal methodMeta.num_inputs(), containing parsed SymbolicShapes
 *         for tensor inputs and empty SymbolicShapes for non-tensor inputs.
 */
std::optional<std::vector<tensor::ShapeConstraint>>
parseDynamicInputShapes(executorch::extension::Module &module, const std::string &methodName);

/**
 * Parses enumerated dimension constraints for the inputs of a module method.
 *
 * @note Like parseDynamicInputShapes, this is a companion-method workaround.
 *       The .pte model must be exported with a companion method named
 *       "get_enumerated_dims_<methodName>" (e.g., "get_enumerated_dims_forward").
 *
 * Python export requirements:
 * 1. The companion method must take no arguments.
 * 2. It must return a list of outputs matching the number of Tag::Tensor inputs
 *    of the target method (scalar inputs are excluded).
 * 3. Each output must be a 2D int32 tensor of shape [num_shapes, rank], where
 *    each row represents an allowed shape for the corresponding input tensor.
 *
 * @param module The ExecuTorch extension module to query.
 * @param methodName The name of the target module method (e.g. "forward").
 * @return A vector of ShapeConstraint objects, or std::nullopt if the companion
 *         method is not defined. If returned, the vector's size is guaranteed
 *         to equal methodMeta.num_inputs(), containing a vector of alternative
 *         SymbolicShapes for tensor inputs and empty ShapeConstraints for
 *         non-tensor inputs.
 */
std::optional<std::vector<tensor::ShapeConstraint>>
parseEnumeratedInputShapes(executorch::extension::Module &module, const std::string &methodName);

} // namespace rnexecutorch::core::model
