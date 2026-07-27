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
enum class ParameterSide { input,
                           output };

/**
 * Reference to a single tensor dimension of a method's input or output.
 * `tensorIdx` counts only tensor parameters (skipping primitives), consistent
 * with ExecuTorch's `inputTensorMeta` / `outputTensorMeta` ordering.
 */
struct DimRef {
    ParameterSide side = ParameterSide::input;
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
 * any given execution. Matched as a declaration during spec validation.
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
 * Parses a JSON-encoded ModelSpec<ConcreteDim> using nlohmann/json, validating
 * every value (positive constants, ordered range bounds, known kinds and tags,
 * in-range indices). Throws std::runtime_error with `ctx` context on invalid
 * JSON or a malformed spec.
 *
 * @param ctx Context description used for error messages.
 * @param json The JSON string to parse.
 * @return The parsed model spec.
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
 * Validates a MethodSpec against ExecuTorch MethodMeta at load time.
 * Checks input/output counts, tags, tensor dtypes, and static shape dimensions.
 * Dynamic dimensions are skipped.
 *
 * @param spec The method spec to validate.
 * @param meta The method metadata from the .pte program.
 * @param methodName Method name for error messages.
 * @throws std::runtime_error on any mismatch.
 */
void validateSpecAgainstMeta(const MethodSpec &spec,
                             const executorch::runtime::MethodMeta &meta,
                             const std::string &methodName);

/**
 * Validates runtime constraints on input tensors before execution.
 * Only input-only constraints are checked; constraints referencing outputs
 * are skipped (ExecuTorch validates output shapes internally).
 *
 * @param rt The JSI runtime instance (for error reporting).
 * @param constraints The constraints to validate.
 * @param inputShapes Per-tensor input shapes (indexed by DimRef.tensorIdx).
 * @param ctx Context string for error messages (e.g. method name).
 * @throws jsi::JSError on constraint violation.
 */
void validateRuntimeConstraints(jsi::Runtime &rt,
                                const std::vector<RuntimeConstraint> &constraints,
                                const std::vector<std::vector<int32_t>> &inputShapes,
                                const std::string &ctx);

} // namespace rnexecutorch::core::schema
