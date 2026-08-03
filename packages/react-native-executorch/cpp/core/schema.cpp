#include "schema.h"

#include <algorithm>
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

template <class... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};

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
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(DimRef, paramSide, tensorIdx, dimIdx)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EqualityConstraint, dims)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(LinearConstraint, dimLhs, dimRhs, coefficients)
NLOHMANN_JSON_SERIALIZE_ENUM(ParamSide, {{ParamSide::input, "input"}, {ParamSide::output, "output"}})

// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void from_json(const json &j, ConcreteDim &d) {
    auto kind = j.at("kind").get<std::string>();
    if (kind == "constant") {
        d = j.at("value").get<int32_t>();
    } else if (kind == "range") {
        d = j.at("range").get<RangeDim>();
    } else if (kind == "enum") {
        d = EnumDim{.choices = j.at("choices").get<std::vector<int32_t>>()};
    } else {
        throw std::runtime_error(std::format("unsupported dim kind '{}'", kind));
    }
}
// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void to_json(json &j, const ConcreteDim &d) {
    // clang-format off
    std::visit(overloaded{
        [&](int32_t c) { j = json::object({{"kind", "constant"}, {"value", c}}); },
        [&](const RangeDim &r) { j = json::object({{"kind", "range"}, {"range", r}}); },
        [&](const EnumDim &e) { j = json::object({{"kind", "enum"}, {"choices", e.choices}}); },
    }, d);
    // clang-format on
}

// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void from_json(const json &j, ParamSpec &p) {
    p.tag = j.at("kind").get<Tag>();
    if (p.tag == Tag::Tensor) {
        p.dtype = types::dtypeFromString(j.at("dtype").get<std::string>());
        p.shape = j.at("shape").get<std::vector<ConcreteDim>>();
    }
}
// NOLINTNEXTLINE(misc-use-internal-linkage): ADL requires external linkage.
void to_json(json &j, const ParamSpec &p) {
    if (p.tag == Tag::Tensor) {
        // DType is (de)serialized via its string helpers — a JSON macro for it
        // would have to live in namespace `types` for ADL to find it.
        j = json::object({{"kind", "Tensor"}, {"dtype", types::dtypeToString(p.dtype)}, {"shape", p.shape}});
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
    // clang-format off
    std::visit(overloaded{
        [&](const EqualityConstraint &eq) { j = json::object({{"kind", "equality"}, {"dims", eq.dims}}); },
        [&](const LinearConstraint &lin) {
            j = json::object({{"kind", "linear"},
                              {"dimLhs", lin.dimLhs},
                              {"dimRhs", lin.dimRhs},
                              {"coefficients", lin.coefficients}});
        },
    }, c);
    // clang-format on
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
        return jsi::Value(jsi::String::createFromUtf8(rt, j.get<std::string>()));
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
    const auto sizes = tensorMeta.sizes();
    return ParamSpec{
        .tag = Tag::Tensor,
        .dtype = types::dtypeFromScalarType(tensorMeta.scalar_type()),
        .shape = std::vector<ConcreteDim>(sizes.begin(), sizes.end()),
    };
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
        if (methodMeta.uses_backend(name) && std::ranges::find(backends, name) == backends.end()) {
            backends.emplace_back(name);
        }
    }
    return backends;
}

// ========================================================
// Validation
// ========================================================

namespace {

void validateConcreteDim(const ConcreteDim &dim, const std::string &ctx) {
    // clang-format off
    std::visit(overloaded{
        [&](int32_t c) {
            if (c <= 0) {
                throw std::runtime_error(std::format("{}: constant dim must be positive", ctx));
            }
        },
        [&](const RangeDim &r) {
            if (r.min < 0) {
                throw std::runtime_error(std::format("{}: range min must be non-negative", ctx));
            }
            if (r.max < r.min) {
                throw std::runtime_error(std::format("{}: range max must be >= min", ctx));
            }
            if (r.step <= 0) {
                throw std::runtime_error(std::format("{}: range step must be positive", ctx));
            }
        },
        [&](const EnumDim &e) {
            if (e.choices.empty()) {
                throw std::runtime_error(std::format("{}: enum must have at least one choice", ctx));
            }
            for (const auto &choice : e.choices) {
                if (choice <= 0) {
                    throw std::runtime_error(std::format("{}: enum choices must be positive", ctx));
                }
            }
        },
    }, dim);
    // clang-format on
}

void validateSpecDimDomains(const MethodSpec &spec, const std::string &ctx) {
    auto validateParams = [&](const std::vector<ParamSpec> &params, const char *label) {
        for (size_t i = 0; i < params.size(); ++i) {
            if (params[i].tag != Tag::Tensor) {
                continue;
            }
            for (size_t d = 0; d < params[i].shape.size(); ++d) {
                auto dctx = std::format("{} {}[{}] dim[{}]", ctx, label, i, d);
                validateConcreteDim(params[i].shape[d], dctx);
            }
        }
    };
    validateParams(spec.inputs, "input");
    validateParams(spec.outputs, "output");
}

void validateTensorParam(const ParamSpec &param,
                         const executorch::runtime::TensorInfo &tensorMeta,
                         const std::string &ctx) {
    auto metaDtype = types::dtypeFromScalarType(tensorMeta.scalar_type());
    if (param.dtype != metaDtype) {
        throw std::runtime_error(std::format("{}: dtype mismatch (spec type '{}' != compiled metadata type '{}')",
                                             ctx, types::dtypeToString(param.dtype), types::dtypeToString(metaDtype)));
    }

    auto metaShape = tensorMeta.sizes();
    if (param.shape.size() != metaShape.size()) {
        throw std::runtime_error(std::format("{}: rank mismatch (spec rank {} != compiled metadata rank {})",
                                             ctx, param.shape.size(), metaShape.size()));
    }

    for (size_t d = 0; d < param.shape.size(); ++d) {
        auto bound = static_cast<int32_t>(metaShape[d]);
        // clang-format off
        std::visit(overloaded{
            [&](int32_t c) {
                if (c != bound) {
                    throw std::runtime_error(std::format("{}: shape[{}] mismatch (spec constant {} != compiled bound {})",
                                                       ctx, d, c, bound));
                }
            },
            [&](const RangeDim &r) {
                if (r.max > bound) {
                    throw std::runtime_error(std::format("{}: shape[{}] range max {} exceeds compiled bound {}",
                                                        ctx, d, r.max, bound));
                }
            },
            [&](const EnumDim &e) {
                for (const auto choice : e.choices) {
                    if (choice > bound) {
                        throw std::runtime_error(std::format("{}: shape[{}] enum choice {} exceeds compiled bound {}",
                                                            ctx, d, choice, bound));
                    }
                }
            },
        },
        param.shape[d]);
        // clang-format on
    }
}

void validateDimRef(const DimRef &ref,
                    const std::vector<size_t> &inputRanks,
                    const std::vector<size_t> &outputRanks,
                    const std::string &ctx) {
    bool isInput = (ref.paramSide == ParamSide::input);
    const auto &ranks = isInput ? inputRanks : outputRanks;
    if (std::cmp_greater_equal(ref.tensorIdx, ranks.size())) {
        throw std::runtime_error(std::format("{}: tensorIdx {} out of range", ctx, ref.tensorIdx));
    }
    if (std::cmp_greater_equal(ref.dimIdx, ranks[static_cast<size_t>(ref.tensorIdx)])) {
        throw std::runtime_error(std::format("{}: dimIdx {} out of range", ctx, ref.dimIdx));
    }
}

std::vector<size_t> gatherTensorRanks(const std::vector<ParamSpec> &params) {
    std::vector<size_t> ranks;
    for (const auto &p : params) {
        if (p.tag == Tag::Tensor) {
            ranks.push_back(p.shape.size());
        }
    }
    return ranks;
}

void validateConstraintSpecs(const MethodSpec &spec, const std::string &ctx) {
    auto inputRanks = gatherTensorRanks(spec.inputs);
    auto outputRanks = gatherTensorRanks(spec.outputs);

    for (size_t i = 0; i < spec.runtimeConstraints.size(); ++i) {
        auto cctx = std::format("{} constraint[{}]", ctx, i);
        const auto &constraint = spec.runtimeConstraints[i];

        // clang-format off
        std::visit(overloaded{
            [&](const EqualityConstraint &eq) {
                if (eq.dims.size() < 2) {
                    throw std::runtime_error(std::format("{}: equality needs at least two dims", cctx));
                }
                for (const auto &dim : eq.dims) {
                    validateDimRef(dim, inputRanks, outputRanks, cctx);
                }
            },
            [&](const LinearConstraint &lin) {
                validateDimRef(lin.dimLhs, inputRanks, outputRanks, cctx);
                validateDimRef(lin.dimRhs, inputRanks, outputRanks, cctx);
            },
        }, constraint);
        // clang-format on
    }
}

void validateParamsAgainstMeta(const std::vector<ParamSpec> &params,
                               bool isInput,
                               const executorch::runtime::MethodMeta &meta,
                               const std::string &ctx) {
    for (size_t i = 0; i < params.size(); ++i) {
        auto pctx = std::format("{} {}[{}]", ctx, isInput ? "input" : "output", i);
        auto tagResult = isInput ? unwrap(pctx, meta.input_tag(i))
                                 : unwrap(pctx, meta.output_tag(i));

        if (params[i].tag != tagResult) {
            throw std::runtime_error(std::format("{}: tag mismatch (spec tag {} != compiled metadata tag {})",
                                                 pctx, executorch::runtime::tag_to_string(params[i].tag),
                                                 executorch::runtime::tag_to_string(tagResult)));
        }

        if (tagResult == Tag::Tensor) {
            auto tensorMeta = isInput ? unwrap(pctx, meta.input_tensor_meta(i))
                                      : unwrap(pctx, meta.output_tensor_meta(i));
            validateTensorParam(params[i], tensorMeta, pctx);
        }
    }
}

} // namespace

void validateSpec(const MethodSpec &spec,
                  const executorch::runtime::MethodMeta &meta,
                  const std::string &ctx) {

    if (spec.inputs.size() != meta.num_inputs()) {
        throw std::runtime_error(std::format("{}: input count mismatch (spec has {}, model metadata has {})",
                                             ctx, spec.inputs.size(), meta.num_inputs()));
    }
    if (spec.outputs.size() != meta.num_outputs()) {
        throw std::runtime_error(std::format("{}: output count mismatch (spec has {}, model metadata has {})",
                                             ctx, spec.outputs.size(), meta.num_outputs()));
    }

    validateSpecDimDomains(spec, ctx);
    validateParamsAgainstMeta(spec.inputs, /*isInput=*/true, meta, ctx);
    validateParamsAgainstMeta(spec.outputs, /*isInput=*/false, meta, ctx);
    validateConstraintSpecs(spec, ctx);
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
        auto cctx = std::format("{} constraint[{}]", ctx, i);

        // clang-format off
        std::visit(overloaded{
            [&](const EqualityConstraint &eq) {
                std::vector<int32_t> inputVals;
                for (const auto &d : eq.dims) {
                    if (d.paramSide == ParamSide::input) {
                        inputVals.push_back(getInputDimValue(d, inputShapes));
                    }
                }
                if (inputVals.size() < 2) {
                    return;
                }
                for (size_t j = 1; j < inputVals.size(); ++j) {
                    if (inputVals[j] != inputVals[0]) {
                        throw jsi::JSError(rt, std::format("{}: equality constraint violated (dimension value {} != {})",
                                                           cctx, inputVals[0], inputVals[j]));
                    }
                }
            },
            [&](const LinearConstraint &lin) {
                if (lin.dimLhs.paramSide == ParamSide::output ||
                    lin.dimRhs.paramSide == ParamSide::output) {
                    return;
                }
                int32_t lhs = getInputDimValue(lin.dimLhs, inputShapes);
                int32_t rhs = getInputDimValue(lin.dimRhs, inputShapes);
                if (lhs != lin.coefficients[0] * rhs + lin.coefficients[1]) {
                    throw jsi::JSError(rt, std::format("{}: linear constraint violated (LHS {} != {} * RHS {} + {})",
                                                       cctx, lhs, lin.coefficients[0], rhs, lin.coefficients[1]));
                }
            },
        }, constraints[i]);
        // clang-format on
    }
}

} // namespace rnexecutorch::core::schema
