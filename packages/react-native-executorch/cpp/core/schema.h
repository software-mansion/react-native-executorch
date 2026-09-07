#pragma once

#include "core/dtype.h"
#include <array>
#include <cstdint>
#include <optional>
#include <string>
#include <unordered_map>
#include <variant>
#include <vector>

#include <jsi/jsi.h>

#include <executorch/runtime/core/evalue.h>
#include <executorch/runtime/core/tag.h>
#include <executorch/runtime/executor/method_meta.h>

/**
 * Model spec types, JSON parsing/serialization, and validation.
 *
 * This module is the C++ counterpart of `src/core/schema.ts`. Both files
 * define the exact same structural data model (`ModelSpec`, `MethodSpec`,
 * `ParamSpec`, `ConcreteDim`, `RuntimeConstraint`, etc.) and validation
 * semantics, but operate at different phases of the lifecycle:
 *
 * - **schema.ts (TypeScript)** — Validates *allowed* (symbolic) specs written by
 *   pipeline authors against *exported* (concrete) specs. Handles symbol binding,
 *   dimension domain matching, and 1-to-1 constraint matching. Runs in JavaScript/TypeScript.
 *
 * - **schema.h / schema.cpp (Native C++)** — Parses exported JSON specs, validates
 *   them at model load time against ExecuTorch `MethodMeta`, and performs dynamic
 *   shape and constraint validation prior to model execution. Runs in native C++.

 * Model specifications originate from one of two sources at load time:
 * 1. **Optional JSON Companion Method**: When a `.pte` model binary exports the
 *    companion method `rnexecutorch::core::model::kGetModelSchemaMethod`,
 *    `ModelHostObject` calls it to retrieve a JSON string. This string is
 *    parsed by `parseModelSpecJson` into a `ModelSpec` containing rich dynamic
 *    dimension domains (`RangeDim`, `EnumDim`) and `RuntimeConstraint`s.
 * 2. **Fallback MethodMeta**: If companion is absent, `methodSpecFromMetadata`
 *    derives a basic `ModelSpec` directly from static ExecuTorch `MethodMeta`
 *    (where all dimensions are static `int32_t` constants and no constraints
 *    are present).
 *
 * The types defined in `schema.h` mirror their TypeScript counterparts in
 * `src/core/schema.ts`:

 * Validation in C++ occurs in two distinct phases:
 *
 * 1. **Load-Time Spec Validation (`validateSpec`)**:
 *    Executed inside `ModelHostObject` constructor when loading a model. It checks
 *    the parsed exported spec (`MethodSpec`) against ExecuTorch's `MethodMeta` metadata.
 *    Verifies that parameter counts, primitive tags, tensor `DType`s, and static shape
 *    dimensions match ExecuTorch's compiled program requirements.
 *
 * 2. **Dynamic Runtime Validation (`validateRuntimeConstraints`)**:
 *    Executed natively in C++ inside `ModelHostObject::execute` immediately prior to
 *    running model inference. It inspects the actual concrete dimensions of user-provided
 *    input tensors and asserts that:
 *    - Dynamic dimensions fall within their declared domains (`RangeDim`
 *      min/max/step or `EnumDim` choices).
 *    - `EqualityConstraint`: Referenced input tensor dimensions evaluate to
 *      identical integer values.
 *    - `LinearConstraint`: Referenced input dimensions satisfy `dimLhs == a *
 *      dimRhs + b`.
 *
 *    *Note on Output Dimension References*: Pre-execution validation only checks
 *    constraints over input dimensions (`ParamSide::input`). References to output
 *    dimensions (`ParamSide::output`) are skipped prior to execution (for `EqualityConstraint`,
 *    output dimension references are filtered out; for `LinearConstraint`, constraints referencing
 *    an output dimension are skipped). After execution, concrete output shapes produced by
 *    ExecuTorch are verified when copying data into user-provided output buffers.
 *
 * @see src/core/schema.ts for the TypeScript validation layer.
 * @see rnexecutorch::core::model::kGetModelSchemaMethod for the companion method constant.
 */
namespace rnexecutorch::core::schema {
namespace jsi = facebook::jsi;

// ========================================================
// Parameter specs
// ========================================================

/**
 * Inclusive integer domain of a single dynamic dimension — values from `min`
 * to `max` in increments of `step`.
 */
struct RangeDim {
    int32_t min = 0;
    int32_t max = 0;
    int32_t step = 1;
};

/**
 * A single dimension matching one of the listed `choices`.
 */
struct EnumDim {
    std::vector<int32_t> choices;
};

/**
 * A dimension of an exported (concrete) model spec.
 */
using ConcreteDim = std::variant<int32_t, RangeDim, EnumDim>;

/**
 * A single input or output parameter of a method. `tag` is the discriminator:
 * `executorch::runtime::Tag::Tensor` for tensor params (in which case
 * `dtype`/`shape` describe the tensor), or any primitive tag for non-tensor
 * params (in which case `dtype`/`shape` are unused).
 */
struct ParamSpec {
    executorch::runtime::Tag tag = executorch::runtime::Tag::None;
    types::DType dtype{};           ///< Valid iff `tag == Tag::Tensor`.
    std::vector<ConcreteDim> shape; ///< Valid iff `tag == Tag::Tensor`.
};

// ========================================================
// Runtime constraints
// ========================================================

/// Whether the referenced tensor dimension belongs to an input or output.
enum class ParamSide { input,
                       output };

/**
 * Reference to a single tensor dimension of a method's input or output.
 * `tensorIdx` counts only tensor parameters (skipping primitives), consistent
 * with ExecuTorch's `inputTensorMeta` / `outputTensorMeta` ordering.
 */
struct DimRef {
    ParamSide paramSide = ParamSide::input;
    int32_t tensorIdx = 0;
    int32_t dimIdx = 0;
};

/**
 * Runtime constraint declaring that all referenced dimensions must be equal
 * to each other in any given execution of the method.
 */
struct EqualityConstraint {
    std::vector<DimRef> dims;
};

/**
 * Runtime constraint declaring that two dimensions must satisfy
 * `dimLhs = coefficients[0] * dimRhs + coefficients[1]` (integer coefficients)
 * in any given execution of the method.
 */
struct LinearConstraint {
    DimRef dimLhs{};
    DimRef dimRhs{};
    std::array<int32_t, 2> coefficients{};
};

/**
 * A requirement on the runtime values of a method's tensor dimensions: the
 * concrete tensors passed to and produced by the method must satisfy it in
 * any given execution.
 */
using RuntimeConstraint = std::variant<EqualityConstraint, LinearConstraint>;

// ========================================================
// Model specs
// ========================================================

/**
 * Spec of a single model method: the ordered input and output parameter
 * specs and the runtime constraints the method declares over its tensor
 * dimensions.
 */
struct MethodSpec {
    std::vector<ParamSpec> inputs;
    std::vector<ParamSpec> outputs;
    std::vector<RuntimeConstraint> runtimeConstraints;
};

/**
 * Spec of a whole model, mapping method names to their MethodSpec.
 */
using ModelSpec = std::unordered_map<std::string, MethodSpec>;

// ========================================================
// Serialization
// ========================================================

/**
 * Parses a JSON-encoded ModelSpec into a C++ `ModelSpec` structure using
 * nlohmann::json. Semantic validation against model metadata is performed
 * separately by `validateSpec`.
 *
 * @param ctx Context description used for error messages.
 * @param json The JSON string to parse.
 * @return The parsed model spec.
 * @throws error::RnExecuTorchException with code SchemaMismatch, carrying
 * `ctx`, on invalid JSON syntax or unrecognized kinds and tags.
 */
ModelSpec parseModelSpecJson(const std::string &ctx, const std::string &json);

/**
 * Serializes a ModelSpec to a fresh JS object matching ModelSpec<ConcreteDim>
 * from src/core/schema.ts.
 *
 * @param rt The JSI runtime instance.
 * @param spec The model spec to serialize.
 * @return The spec as a JS value.
 */
jsi::Value modelSpecToJs(jsi::Runtime &rt, const ModelSpec &spec);

/**
 * Serializes a backends map to a JSI object mapping method names to arrays of
 * backend name strings.
 *
 * @param rt The JSI runtime instance.
 * @param backends Map of method name -> backend name list.
 * @return The backends as a JSI object.
 */
jsi::Object backendsToJs(jsi::Runtime &rt,
                         const std::unordered_map<std::string, std::vector<std::string>> &backends);

// ========================================================
// Metadata reflection
// ========================================================

/**
 * Builds a MethodSpec directly from ExecuTorch MethodMeta, without requiring
 * a JSON companion. All shapes become ConcreteDim constants since MethodMeta
 * only exposes the static shape from export.
 *
 * @param methodMeta The method metadata from the .pte program.
 * @return A MethodSpec derived from the metadata.
 */
MethodSpec methodSpecFromMetadata(const executorch::runtime::MethodMeta &methodMeta);

/**
 * Collects the names of backends declared as used by a method.
 *
 * @param methodMeta The method metadata from the .pte program.
 * @return Vector of backend names for which uses_backend returns true.
 */
std::vector<std::string> getUsedBackends(const executorch::runtime::MethodMeta &methodMeta);

// ========================================================
// Validation
// ========================================================

/**
 * Validates a MethodSpec against ExecuTorch MethodMeta at load time. Performs
 * the following checks:
 * 1. Dimension domain validity: positive constant values, ordered range bounds
 *    (`min > 0`, `max >= min`, `step > 0`), and non-empty positive enum
 *    choices.
 * 2. Parameter metadata matching: input/output counts, parameter primitive
 *    tags, tensor `DType`s, tensor ranks, exact values of static constant
 *    dimensions, and dynamic dimension upper bounds (`RangeDim` max and
 *    `EnumDim` choices <= compiled `MethodMeta` allocation bound).
 * 3. Constraint structure: verifies `EqualityConstraint` has at least 2
 *    dimensions and all `DimRef` tensor and dimension indices are within valid
 *    input/output rank bounds.
 *
 * @param spec The method spec to validate.
 * @param meta The method metadata from the .pte program.
 * @param ctx Context string for error messages.
 * @throws error::RnExecuTorchException with code SchemaMismatch on any
 * mismatch or invalid spec.
 */
void validateSpec(const MethodSpec &spec,
                  const executorch::runtime::MethodMeta &meta,
                  const std::string &ctx);

/**
 * Validates runtime constraints against actual concrete input tensor shapes before execution.
 *
 * References to output dimensions (`ParamSide::output`) are skipped prior to
 * execution (for `EqualityConstraint`, output dimension references are filtered
 * out; for `LinearConstraint`, constraints referencing an output dimension are
 * skipped). After execution, concrete output shapes produced by ExecuTorch are
 * verified when copying data into user-provided output buffers.
 *
 * @param rt The JSI runtime instance (for error reporting).
 * @param constraints The list of runtime constraints to validate.
 * @param inputShapes Per-tensor input shapes (indexed by `DimRef.tensorIdx`).
 * @param ctx Context string for error messages (e.g. method name).
 * @throws error::RnExecuTorchException with code InvalidArgument on constraint
 * violation.
 */
void validateRuntimeConstraints(jsi::Runtime &rt,
                                const std::vector<RuntimeConstraint> &constraints,
                                const std::vector<std::vector<int32_t>> &inputShapes,
                                const std::string &ctx);

} // namespace rnexecutorch::core::schema
