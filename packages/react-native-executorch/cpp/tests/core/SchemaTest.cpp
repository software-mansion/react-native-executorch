#include <stdexcept>
#include <string>
#include <vector>

#include "support/JsiTestEnv.h"

#include "core/schema.h"

namespace rnexecutorch::tests {
namespace {

namespace schema = rnexecutorch::core::schema;
using rnexecutorch::core::types::DType;
using ::testing::HasSubstr;

// Schema is the contract between an exported .pte and the JS caller. The parse
// and runtime-constraint halves need no ExecuTorch program, so they are covered
// here; validateSpec/methodSpecFromMetadata need a real MethodMeta and belong
// with the on-device integration tests instead (see README.md).

std::string minimalSpecJson(const std::string &shape) {
    return R"({"forward": {"inputs": [{"kind": "Tensor", "dtype": "float32", "shape": )" +
           shape + R"(}], "outputs": [], "runtimeConstraints": []}})";
}

TEST(SchemaParse, ParsesConstantDims) {
    auto spec = schema::parseModelSpecJson(
        "ctx", minimalSpecJson(R"([{"kind": "constant", "value": 3}])"));

    ASSERT_TRUE(spec.contains("forward"));
    const auto &input = spec.at("forward").inputs.at(0);
    EXPECT_EQ(input.tag, executorch::runtime::Tag::Tensor);
    EXPECT_EQ(input.dtype, DType::float32);
    ASSERT_EQ(input.shape.size(), 1u);
    EXPECT_EQ(std::get<int32_t>(input.shape.at(0)), 3);
}

TEST(SchemaParse, ParsesRangeDims) {
    auto spec = schema::parseModelSpecJson(
        "ctx",
        minimalSpecJson(R"([{"kind": "range", "range": {"min": 1, "max": 512, "step": 8}}])"));

    const auto &dim = std::get<schema::RangeDim>(spec.at("forward").inputs.at(0).shape.at(0));
    EXPECT_EQ(dim.min, 1);
    EXPECT_EQ(dim.max, 512);
    EXPECT_EQ(dim.step, 8);
}

TEST(SchemaParse, ParsesEnumDims) {
    auto spec = schema::parseModelSpecJson(
        "ctx", minimalSpecJson(R"([{"kind": "enum", "choices": [80, 128]}])"));

    const auto &dim = std::get<schema::EnumDim>(spec.at("forward").inputs.at(0).shape.at(0));
    EXPECT_EQ(dim.choices, (std::vector<int32_t>{80, 128}));
}

TEST(SchemaParse, ParsesNonTensorParamsWithoutDtypeOrShape) {
    auto spec = schema::parseModelSpecJson(
        "ctx",
        R"({"forward": {"inputs": [{"kind": "Int"}], "outputs": [], "runtimeConstraints": []}})");

    EXPECT_EQ(spec.at("forward").inputs.at(0).tag, executorch::runtime::Tag::Int);
}

TEST(SchemaParse, ParsesRuntimeConstraints) {
    auto spec = schema::parseModelSpecJson("ctx", R"({
        "forward": {
            "inputs": [], "outputs": [],
            "runtimeConstraints": [
                {"kind": "equality",
                 "dims": [{"paramSide": "input", "tensorIdx": 0, "dimIdx": 1},
                          {"paramSide": "input", "tensorIdx": 1, "dimIdx": 0}]},
                {"kind": "linear",
                 "dimLhs": {"paramSide": "input", "tensorIdx": 0, "dimIdx": 0},
                 "dimRhs": {"paramSide": "output", "tensorIdx": 0, "dimIdx": 0},
                 "coefficients": [2, 1]}
            ]
        }
    })");

    const auto &constraints = spec.at("forward").runtimeConstraints;
    ASSERT_EQ(constraints.size(), 2u);

    const auto &equality = std::get<schema::EqualityConstraint>(constraints.at(0));
    ASSERT_EQ(equality.dims.size(), 2u);
    EXPECT_EQ(equality.dims.at(1).tensorIdx, 1);

    const auto &linear = std::get<schema::LinearConstraint>(constraints.at(1));
    EXPECT_EQ(linear.dimRhs.paramSide, schema::ParamSide::output);
    EXPECT_EQ(linear.coefficients.at(0), 2);
}

TEST(SchemaParse, RejectsMalformedJson) {
    EXPECT_THROW(schema::parseModelSpecJson("ctx", "{not json"), std::runtime_error);
}

TEST(SchemaParse, RejectsUnknownKinds) {
    EXPECT_THROW(schema::parseModelSpecJson(
                     "ctx", minimalSpecJson(R"([{"kind": "wobbly"}])")),
                 std::runtime_error);
    EXPECT_THROW(schema::parseModelSpecJson(
                     "ctx",
                     R"({"forward": {"inputs": [{"kind": "Quaternion"}], "outputs": [], "runtimeConstraints": []}})"),
                 std::runtime_error);
}

TEST(SchemaParse, ErrorMessageCarriesContext) {
    try {
        schema::parseModelSpecJson("my-model.pte", "{not json");
        FAIL() << "expected parseModelSpecJson to throw";
    } catch (const std::runtime_error &e) {
        EXPECT_THAT(std::string(e.what()), HasSubstr("my-model.pte"));
    }
}

// --- Runtime constraints ----------------------------------------------------

using SchemaConstraintTest = JsiTestEnv;

schema::DimRef inputDim(int32_t tensorIdx, int32_t dimIdx) {
    return schema::DimRef{.paramSide = schema::ParamSide::input, .tensorIdx = tensorIdx, .dimIdx = dimIdx};
}

schema::DimRef outputDim(int32_t tensorIdx, int32_t dimIdx) {
    return schema::DimRef{.paramSide = schema::ParamSide::output, .tensorIdx = tensorIdx, .dimIdx = dimIdx};
}

TEST_F(SchemaConstraintTest, EqualityPassesWhenDimensionsMatch) {
    std::vector<schema::RuntimeConstraint> constraints{
        schema::EqualityConstraint{.dims = {inputDim(0, 1), inputDim(1, 0)}}};

    EXPECT_NO_THROW(schema::validateRuntimeConstraints(rt(), constraints, {{4, 16}, {16, 2}}, "forward"));
}

TEST_F(SchemaConstraintTest, EqualityThrowsWhenDimensionsDiffer) {
    std::vector<schema::RuntimeConstraint> constraints{
        schema::EqualityConstraint{.dims = {inputDim(0, 1), inputDim(1, 0)}}};

    try {
        schema::validateRuntimeConstraints(rt(), constraints, {{4, 16}, {8, 2}}, "forward");
        FAIL() << "expected a constraint violation";
    } catch (const facebook::jsi::JSError &e) {
        EXPECT_THAT(e.getMessage(), HasSubstr("equality constraint violated"));
        EXPECT_THAT(e.getMessage(), HasSubstr("forward constraint[0]"));
    }
}

TEST_F(SchemaConstraintTest, EqualityIgnoresOutputSideDimensions) {
    // Output shapes are unknown before execution, so a constraint that reduces
    // to fewer than two input dimensions must be skipped, not guessed at.
    std::vector<schema::RuntimeConstraint> constraints{
        schema::EqualityConstraint{.dims = {inputDim(0, 0), outputDim(0, 0)}}};

    EXPECT_NO_THROW(schema::validateRuntimeConstraints(rt(), constraints, {{4}}, "forward"));
}

TEST_F(SchemaConstraintTest, LinearPassesWhenSatisfied) {
    // lhs == 2 * rhs + 1  ->  9 == 2 * 4 + 1
    std::vector<schema::RuntimeConstraint> constraints{
        schema::LinearConstraint{.dimLhs = inputDim(0, 0), .dimRhs = inputDim(1, 0), .coefficients = {2, 1}}};

    EXPECT_NO_THROW(schema::validateRuntimeConstraints(rt(), constraints, {{9}, {4}}, "forward"));
}

TEST_F(SchemaConstraintTest, LinearThrowsWhenViolated) {
    std::vector<schema::RuntimeConstraint> constraints{
        schema::LinearConstraint{.dimLhs = inputDim(0, 0), .dimRhs = inputDim(1, 0), .coefficients = {2, 1}}};

    try {
        schema::validateRuntimeConstraints(rt(), constraints, {{10}, {4}}, "forward");
        FAIL() << "expected a constraint violation";
    } catch (const facebook::jsi::JSError &e) {
        EXPECT_THAT(e.getMessage(), HasSubstr("linear constraint violated"));
    }
}

TEST_F(SchemaConstraintTest, LinearSkippedWhenEitherSideIsAnOutput) {
    std::vector<schema::RuntimeConstraint> constraints{
        schema::LinearConstraint{.dimLhs = inputDim(0, 0), .dimRhs = outputDim(0, 0), .coefficients = {2, 1}}};

    EXPECT_NO_THROW(schema::validateRuntimeConstraints(rt(), constraints, {{10}}, "forward"));
}

TEST_F(SchemaConstraintTest, ReportsTheOffendingConstraintIndex) {
    std::vector<schema::RuntimeConstraint> constraints{
        schema::EqualityConstraint{.dims = {inputDim(0, 0), inputDim(1, 0)}},
        schema::LinearConstraint{.dimLhs = inputDim(0, 0), .dimRhs = inputDim(1, 0), .coefficients = {5, 0}}};

    try {
        schema::validateRuntimeConstraints(rt(), constraints, {{4}, {4}}, "forward");
        FAIL() << "expected the second constraint to fail";
    } catch (const facebook::jsi::JSError &e) {
        EXPECT_THAT(e.getMessage(), HasSubstr("constraint[1]"));
    }
}

} // namespace
} // namespace rnexecutorch::tests
