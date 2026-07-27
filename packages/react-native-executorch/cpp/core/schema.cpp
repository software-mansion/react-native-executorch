#include "schema.h"

#include <format>
#include <utility>

#include <jsi/jsi.h>
#include <nlohmann/json.hpp>

#include "dtype.h"

namespace nlohmann {
template <>
// Tag lives in executorch::runtime; adl_serializer is the
// nlohmann-blessed extension point for types we don't own.
// See: https://github.com/nlohmann/json#how-do-i-convert-third-party-types
struct adl_serializer<executorch::runtime::Tag> {
    static executorch::runtime::Tag from_json(const json &j) {
        auto s = j.get<std::string>();
        if (s == "Tensor") {
            return executorch::runtime::Tag::Tensor;
        }
        if (s == "Int") {
            return executorch::runtime::Tag::Int;
        }
        if (s == "None") {
            return executorch::runtime::Tag::None;
        }
        if (s == "Bool") {
            return executorch::runtime::Tag::Bool;
        }
        if (s == "Double") {
            return executorch::runtime::Tag::Double;
        }
        if (s == "String") {
            return executorch::runtime::Tag::String;
        }
        if (s == "ListInt") {
            return executorch::runtime::Tag::ListInt;
        }
        if (s == "ListBool") {
            return executorch::runtime::Tag::ListBool;
        }
        if (s == "ListDouble") {
            return executorch::runtime::Tag::ListDouble;
        }
        if (s == "ListTensor") {
            return executorch::runtime::Tag::ListTensor;
        }
        throw std::runtime_error(std::format("unknown param kind '{}'", s));
    }
    static void to_json(json &j, executorch::runtime::Tag t) {
        j = executorch::runtime::tag_to_string(t);
    }
};
} // namespace nlohmann

namespace rnexecutorch::core::schema {
namespace types = rnexecutorch::core::types;

using executorch::runtime::Tag;
using nlohmann::json;

namespace {

template <typename T>
T unwrap(const std::string &ctx, executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw std::runtime_error(std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())));
    }
    return std::move(result.get());
}

} // namespace

// ========================================================
// Nlohmann JSON conversions
// ========================================================

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RangeDim, min, max, step)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EnumDim, choices)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(DimRef, side, tensorIdx, dimIdx)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EqualityConstraint, dims)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(LinearConstraint, dimLhs, dimRhs, coefficients)
NLOHMANN_JSON_SERIALIZE_ENUM(ParameterSide, {
                                                {ParameterSide::input, "input"},
                                                {ParameterSide::output, "output"},
                                            })
NLOHMANN_JSON_SERIALIZE_ENUM(types::DType, {
                                               {types::DType::uint8, "uint8"},
                                               {types::DType::int32, "int32"},
                                               {types::DType::int64, "int64"},
                                               {types::DType::float32, "float32"},
                                           })

// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void from_json(const json &j, ConcreteDim &d) {
    auto kind = j.at("kind").get<std::string>();
    if (kind == "constant") {
        d = j.at("value").get<int32_t>();
    } else if (kind == "range") {
        d = j.at("range").get<RangeDim>();
    } else if (kind == "enum") {
        d = j.at("choices").get<EnumDim>();
    } else {
        throw std::runtime_error(std::format("unsupported dim kind '{}'", kind));
    }
}
// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void to_json(json &j, const ConcreteDim &d) {
    if (const auto *c = std::get_if<int32_t>(&d)) {
        j = json::object({{"kind", "constant"}, {"value", *c}});
    }
    if (const auto *r = std::get_if<RangeDim>(&d)) {
        j = json::object({{"kind", "range"}, {"range", *r}});
    }
    if (const auto *e = std::get_if<EnumDim>(&d)) {
        j = json::object({{"kind", "enum"}, {"choices", *e}});
    }
}

// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void from_json(const json &j, ParamSpec &p) {
    p.tag = j.at("kind").get<Tag>();
    if (p.tag == Tag::Tensor) {
        p.dtype = j.at("dtype").get<types::DType>();
        p.shape = j.at("shape").get<std::vector<ConcreteDim>>();
    }
}
// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void to_json(json &j, const ParamSpec &p) {
    if (p.tag == Tag::Tensor) {
        j = json::object({{"kind", "Tensor"}, {"dtype", p.dtype}, {"shape", p.shape}});
    } else {
        j = json::object({{"kind", p.tag}});
    }
}

// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void from_json(const json &j, RuntimeConstraint &c) {
    auto kind = j.at("kind").get<std::string>();
    if (kind == "equality") {
        c = j.get<EqualityConstraint>();
    } else if (kind == "linear") {
        c = j.get<LinearConstraint>();
    } else {
        throw std::runtime_error(std::format("unknown constraint kind '{}'", kind));
    }
}
// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void to_json(json &j, const RuntimeConstraint &c) {
    if (const auto *eq = std::get_if<EqualityConstraint>(&c)) {
        j = json::object({{"kind", "equality"}, {"dims", eq->dims}});
    }
    if (const auto *lin = std::get_if<LinearConstraint>(&c)) {
        j = json::object({{"kind", "linear"},
                          {"dimLhs", lin->dimLhs},
                          {"dimRhs", lin->dimRhs},
                          {"coefficients", lin->coefficients}});
    }
}

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(MethodSpec, inputs, outputs, runtimeConstraints)

// ========================================================
// Serialization
// ========================================================

ModelSpec parseModelSpecJson(const std::string &ctx, const std::string &jsonStr) {
    try {
        return json::parse(jsonStr).get<ModelSpec>();
    } catch (const std::exception &e) {
        throw std::runtime_error(std::format("{}: {}", ctx, e.what()));
    }
}

namespace {

// NOLINTNEXTLINE(misc-no-recursion): recursion is bounded by JSON nesting depth.
jsi::Value jsonToJs(jsi::Runtime &rt, const json &j) {
    switch (j.type()) {
    case json::value_t::null:
        return jsi::Value::null();
    case json::value_t::boolean:
        return jsi::Value(j.get<bool>());
    case json::value_t::number_integer:
    case json::value_t::number_unsigned:
        return jsi::Value(static_cast<double>(j.get<int64_t>()));
    case json::value_t::number_float:
        return jsi::Value(j.get<double>());
    case json::value_t::string:
        return jsi::String::createFromUtf8(rt, j.get<std::string>());
    case json::value_t::array: {
        auto arr = jsi::Array(rt, j.size());
        size_t i = 0;
        for (const auto &el : j) {
            arr.setValueAtIndex(rt, i++, jsonToJs(rt, el));
        }
        return arr;
    }
    case json::value_t::object: {
        auto obj = jsi::Object(rt);
        for (const auto &[k, v] : j.items()) {
            obj.setProperty(rt, k.c_str(), jsonToJs(rt, v));
        }
        return obj;
    }
    default:
        return jsi::Value::undefined();
    }
}

} // namespace

jsi::Value modelSpecToJs(jsi::Runtime &rt, const ModelSpec &spec) {
    return jsonToJs(rt, spec);
}

jsi::Object backendsToJs(jsi::Runtime &rt,
                         const std::unordered_map<std::string, std::vector<std::string>> &backends) {
    jsi::Object obj(rt);
    for (const auto &[methodName, backendList] : backends) {
        auto arr = jsi::Array(rt, backendList.size());
        for (size_t i = 0; i < backendList.size(); ++i) {
            arr.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, backendList[i]));
        }
        obj.setProperty(rt, methodName.c_str(), arr);
    }
    return obj;
}

// ========================================================
// Metadata reflection
// ========================================================

namespace {

ParamSpec tensorMetaToParamSpec(const executorch::runtime::TensorInfo &tensorMeta) {
    ParamSpec p{.tag = Tag::Tensor, .dtype = types::fromScalarType(tensorMeta.scalar_type())};
    const auto sizes = tensorMeta.sizes();
    p.shape.reserve(sizes.size());
    for (const auto size : sizes) {
        p.shape.emplace_back(size);
    }
    return p;
}

} // namespace

MethodSpec methodSpecFromMetadata(const executorch::runtime::MethodMeta &methodMeta) {
    MethodSpec spec;

    spec.inputs.reserve(methodMeta.num_inputs());
    for (size_t i = 0; i < methodMeta.num_inputs(); ++i) {
        auto ctx = std::format("buildFromMetadata input[{}]", i);
        auto tag = unwrap(ctx, methodMeta.input_tag(i));
        if (tag == Tag::Tensor) {
            auto tensorMeta = unwrap(ctx, methodMeta.input_tensor_meta(i));
            spec.inputs.emplace_back(tensorMetaToParamSpec(tensorMeta));
        } else {
            spec.inputs.emplace_back(ParamSpec{.tag = tag});
        }
    }

    spec.outputs.reserve(methodMeta.num_outputs());
    for (size_t i = 0; i < methodMeta.num_outputs(); ++i) {
        auto ctx = std::format("buildFromMetadata output[{}]", i);
        auto tag = unwrap(ctx, methodMeta.output_tag(i));
        if (tag == Tag::Tensor) {
            auto tensorMeta = unwrap(ctx, methodMeta.output_tensor_meta(i));
            spec.outputs.emplace_back(tensorMetaToParamSpec(tensorMeta));
        } else {
            spec.outputs.emplace_back(ParamSpec{.tag = tag});
        }
    }

    return spec;
}

std::vector<std::string> getUsedBackends(const executorch::runtime::MethodMeta &methodMeta) {
    std::vector<std::string> backends;
    for (size_t i = 0; i < methodMeta.num_backends(); ++i) {
        auto ctx = std::format("getUsedBackends: backend [{}]", i);
        const auto *name = unwrap(ctx, methodMeta.get_backend_name(i));
        if (methodMeta.uses_backend(name)) {
            backends.emplace_back(name);
        }
    }
    return backends;
}

// ========================================================
// Validation
// ========================================================

namespace {

void validateParamAgainstMeta(const ParamSpec &param,
                              const executorch::runtime::TensorInfo &tensorMeta,
                              const std::string &ctx) {
    auto metaDtype = types::fromScalarType(tensorMeta.scalar_type());
    if (param.dtype != metaDtype) {
        throw std::runtime_error(std::format("{}: dtype mismatch: schema has '{}', metadata has '{}",
                                             ctx, types::toString(param.dtype), types::toString(metaDtype)));
    }
    auto metaShape = tensorMeta.sizes();
    if (param.shape.size() != metaShape.size()) {
        throw std::runtime_error(std::format("{}: rank mismatch: schema has {}, metadata has {}",
                                             ctx, param.shape.size(), metaShape.size()));
    }
    for (size_t d = 0; d < param.shape.size(); ++d) {
        if (const auto *c = std::get_if<int32_t>(&param.shape[d])) {
            if (*c != metaShape[d]) {
                throw std::runtime_error(std::format("{}: shape[{}] mismatch: schema has {}, metadata has {}",
                                                     ctx, d, *c, metaShape[d]));
            }
        }
    }
}

void validateDimRefAgainstSpec(const DimRef &ref,
                               size_t numTensorInputs, size_t numTensorOutputs,
                               const std::vector<size_t> &inputRanks,
                               const std::vector<size_t> &outputRanks,
                               const std::string &ctx) {
    bool isInput = (ref.side == ParameterSide::input);
    size_t numTensors = isInput ? numTensorInputs : numTensorOutputs;
    const auto &ranks = isInput ? inputRanks : outputRanks;
    if (std::cmp_greater_equal(ref.tensorIdx, numTensors)) {
        throw std::runtime_error(std::format("{}: DimRef tensorIdx {} out of range (have {} {} tensors)",
                                             ctx, ref.tensorIdx, numTensors, isInput ? "input" : "output"));
    }
    if (std::cmp_greater_equal(ref.dimIdx, ranks[static_cast<size_t>(ref.tensorIdx)])) {
        throw std::runtime_error(std::format("{}: DimRef dimIdx {} out of range for tensor (rank {})",
                                             ctx, ref.dimIdx, ranks[static_cast<size_t>(ref.tensorIdx)]));
    }
}

void validateConstraintsAgainstSpec(const MethodSpec &spec, const std::string &methodName) {
    size_t numTensorInputs = 0;
    std::vector<size_t> inputRanks;
    for (const auto &p : spec.inputs) {
        if (p.tag == Tag::Tensor) {
            inputRanks.push_back(p.shape.size());
            ++numTensorInputs;
        }
    }
    size_t numTensorOutputs = 0;
    std::vector<size_t> outputRanks;
    for (const auto &p : spec.outputs) {
        if (p.tag == Tag::Tensor) {
            outputRanks.push_back(p.shape.size());
            ++numTensorOutputs;
        }
    }

    for (size_t i = 0; i < spec.runtimeConstraints.size(); ++i) {
        auto ctx = std::format("loadModel: method '{}' constraint[{}]", methodName, i);
        const auto &constraint = spec.runtimeConstraints[i];

        if (const auto *eq = std::get_if<EqualityConstraint>(&constraint)) {
            if (eq->dims.size() < 2) {
                throw std::runtime_error(std::format("{}: equality constraint requires at least two dims", ctx));
            }
            for (const auto &dim : eq->dims) {
                validateDimRefAgainstSpec(dim, numTensorInputs, numTensorOutputs,
                                          inputRanks, outputRanks, ctx);
            }
        } else if (const auto *lin = std::get_if<LinearConstraint>(&constraint)) {
            validateDimRefAgainstSpec(lin->dimLhs, numTensorInputs, numTensorOutputs,
                                      inputRanks, outputRanks, ctx + " dimLhs");
            validateDimRefAgainstSpec(lin->dimRhs, numTensorInputs, numTensorOutputs,
                                      inputRanks, outputRanks, ctx + " dimRhs");
        }
    }
}

} // namespace

void validateSpecAgainstMeta(const MethodSpec &spec,
                             const executorch::runtime::MethodMeta &meta,
                             const std::string &methodName) {
    if (spec.inputs.size() != meta.num_inputs()) {
        throw std::runtime_error(std::format("loadModel: method '{}' input count mismatch: "
                                             "schema has {}, metadata has {}",
                                             methodName, spec.inputs.size(), meta.num_inputs()));
    }
    if (spec.outputs.size() != meta.num_outputs()) {
        throw std::runtime_error(std::format("loadModel: method '{}' output count mismatch: "
                                             "schema has {}, metadata has {}",
                                             methodName, spec.outputs.size(), meta.num_outputs()));
    }

    for (size_t i = 0; i < spec.inputs.size(); ++i) {
        auto ctx = std::format("loadModel: method '{}' input[{}]", methodName, i);
        auto metaTag = unwrap(ctx, meta.input_tag(i));
        if (spec.inputs[i].tag != metaTag) {
            throw std::runtime_error(std::format("{}: tag mismatch: schema has '{}', metadata has '{}",
                                                 ctx, executorch::runtime::tag_to_string(spec.inputs[i].tag),
                                                 executorch::runtime::tag_to_string(metaTag)));
        }
        if (metaTag == Tag::Tensor) {
            auto tensorMeta = unwrap(ctx, meta.input_tensor_meta(i));
            validateParamAgainstMeta(spec.inputs[i], tensorMeta, ctx);
        }
    }

    for (size_t i = 0; i < spec.outputs.size(); ++i) {
        auto ctx = std::format("loadModel: method '{}' output[{}]", methodName, i);
        auto metaTag = unwrap(ctx, meta.output_tag(i));
        if (spec.outputs[i].tag != metaTag) {
            throw std::runtime_error(std::format("{}: tag mismatch: schema has '{}', metadata has '{}",
                                                 ctx, executorch::runtime::tag_to_string(spec.outputs[i].tag),
                                                 executorch::runtime::tag_to_string(metaTag)));
        }
        if (metaTag == Tag::Tensor) {
            auto tensorMeta = unwrap(ctx, meta.output_tensor_meta(i));
            validateParamAgainstMeta(spec.outputs[i], tensorMeta, ctx);
        }
    }

    validateConstraintsAgainstSpec(spec, methodName);
}

namespace {

int32_t getInputDimValue(const DimRef &ref,
                         const std::vector<std::vector<int32_t>> &inputShapes) {
    return inputShapes[static_cast<size_t>(ref.tensorIdx)][static_cast<size_t>(ref.dimIdx)];
}

} // namespace

void validateRuntimeConstraints(jsi::Runtime &rt,
                                const std::vector<RuntimeConstraint> &constraints,
                                const std::vector<std::vector<int32_t>> &inputShapes,
                                const std::string &ctx) {
    for (size_t i = 0; i < constraints.size(); ++i) {
        const auto &constraint = constraints[i];
        auto cctx = std::format("{} constraint[{}]", ctx, i);

        if (const auto *eq = std::get_if<EqualityConstraint>(&constraint)) {
            if (eq->dims.size() < 2) {
                continue;
            }
            // Skip if any dim references an output — ExecuTorch validates output shapes
            if (std::ranges::any_of(eq->dims,
                                    [](const auto &d) { return d.side == ParameterSide::output; })) {
                continue;
            }
            int32_t first = getInputDimValue(eq->dims[0], inputShapes);
            for (size_t j = 1; j < eq->dims.size(); ++j) {
                int32_t val = getInputDimValue(eq->dims[j], inputShapes);
                if (val != first) {
                    throw jsi::JSError(rt, std::format("{}: equality constraint violated: "
                                                       "expected all dims to be {}, got {}",
                                                       cctx, first, val));
                }
            }
        } else if (const auto *lin = std::get_if<LinearConstraint>(&constraint)) {
            if (lin->dimLhs.side == ParameterSide::output ||
                lin->dimRhs.side == ParameterSide::output) {
                continue;
            }
            int32_t lhs = getInputDimValue(lin->dimLhs, inputShapes);
            int32_t rhs = getInputDimValue(lin->dimRhs, inputShapes);
            int32_t expected = lin->coefficients[0] * rhs + lin->coefficients[1];
            if (lhs != expected) {
                throw jsi::JSError(rt, std::format("{}: linear constraint violated: "
                                                   "expected {} = {} * {} + {}",
                                                   cctx, lhs, lin->coefficients[0], rhs,
                                                   lin->coefficients[1]));
            }
        }
    }
}

} // namespace rnexecutorch::core::schema
