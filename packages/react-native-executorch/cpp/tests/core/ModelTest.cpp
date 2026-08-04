#include <format>
#include <string>
#include <vector>

#include "support/JsiTestEnv.h"

#include "core/schema.h"

#include <executorch/extension/module/module.h>

namespace rnexecutorch::tests {
namespace {

namespace schema = rnexecutorch::core::schema;
using rnexecutorch::core::types::DType;
using ::testing::HasSubstr;

// These suites need a real ExecuTorch program, because MethodMeta only exists
// once one is loaded. The fixture is selfie-segmentation (~486 KB, the smallest
// model the org publishes), fetched by scripts/fetch-test-fixtures.sh.
//
// Note what this does NOT need: the XNNPACK delegate. ModelHostObject's
// constructor only calls Module::load() and Module::method_meta(), both of which
// parse the program without initialising delegates. Executing the model would
// need an XNNPACK host build; that stays out of scope here, so these tests cover
// the load path only.
//
// The fixture's shape contract, from its published config.json:
//   forward: input [1, 3, 256, 256] float32 -> output [1, 1, 256, 256] float32

constexpr const char *kFixture = RNE_MODEL_FIXTURE;

std::string loadFixtureJs() {
    return std::format("const model = __rnexecutorch_jsi__.loadModel('{}');", kFixture);
}

// --- Metadata reflection, exercised directly ---------------------------------

class MethodMetaTest : public JsiTestEnv {
  protected:
    void SetUp() override {
        JsiTestEnv::SetUp();
        module_ = std::make_unique<executorch::extension::Module>(kFixture);
        ASSERT_EQ(module_->load(), executorch::runtime::Error::Ok);
    }

    executorch::runtime::MethodMeta meta(const std::string &method = "forward") {
        auto result = module_->method_meta(method);
        EXPECT_TRUE(result.ok());
        return result.get();
    }

    std::unique_ptr<executorch::extension::Module> module_;
};

TEST_F(MethodMetaTest, DerivesSpecFromMetadata) {
    auto spec = schema::methodSpecFromMetadata(meta());

    ASSERT_EQ(spec.inputs.size(), 1u);
    ASSERT_EQ(spec.outputs.size(), 1u);

    const auto &input = spec.inputs.at(0);
    EXPECT_EQ(input.tag, executorch::runtime::Tag::Tensor);
    EXPECT_EQ(input.dtype, DType::float32);
    ASSERT_EQ(input.shape.size(), 4u);
    // MethodMeta only carries the static export shape, so every dim is constant.
    EXPECT_EQ(std::get<int32_t>(input.shape.at(0)), 1);
    EXPECT_EQ(std::get<int32_t>(input.shape.at(1)), 3);
    EXPECT_EQ(std::get<int32_t>(input.shape.at(2)), 256);
    EXPECT_EQ(std::get<int32_t>(input.shape.at(3)), 256);

    const auto &output = spec.outputs.at(0);
    EXPECT_EQ(output.dtype, DType::float32);
    ASSERT_EQ(output.shape.size(), 4u);
    EXPECT_EQ(std::get<int32_t>(output.shape.at(1)), 1);
    EXPECT_EQ(std::get<int32_t>(output.shape.at(3)), 256);
}

TEST_F(MethodMetaTest, DerivedSpecCarriesNoRuntimeConstraints) {
    // Constraints only come from the JSON companion; metadata alone has none.
    EXPECT_TRUE(schema::methodSpecFromMetadata(meta()).runtimeConstraints.empty());
}

TEST_F(MethodMetaTest, ReportsUsedBackendsDeduplicated) {
    // The fixture is partitioned into many XNNPACK delegate segments; the
    // reported list must name each backend once, not once per segment.
    auto backends = schema::getUsedBackends(meta());
    EXPECT_EQ(backends, std::vector<std::string>{"XnnpackBackend"});
    EXPECT_GT(meta().num_backends(), 1u) << "fixture no longer has multiple segments; "
                                            "the dedup assertion above is now vacuous";
}

TEST_F(MethodMetaTest, ValidateSpecAcceptsTheMetadataDerivedSpec) {
    // The spec read straight out of the program must satisfy its own validation.
    auto spec = schema::methodSpecFromMetadata(meta());
    EXPECT_NO_THROW(schema::validateSpec(spec, meta(), "forward"));
}

TEST_F(MethodMetaTest, ValidateSpecRejectsWrongDtype) {
    auto spec = schema::methodSpecFromMetadata(meta());
    spec.inputs.at(0).dtype = DType::int32;
    EXPECT_THROW(schema::validateSpec(spec, meta(), "forward"), std::runtime_error);
}

TEST_F(MethodMetaTest, ValidateSpecRejectsWrongStaticDimension) {
    auto spec = schema::methodSpecFromMetadata(meta());
    spec.inputs.at(0).shape.at(2) = 128; // the program says 256
    EXPECT_THROW(schema::validateSpec(spec, meta(), "forward"), std::runtime_error);
}

TEST_F(MethodMetaTest, ValidateSpecRejectsWrongRank) {
    auto spec = schema::methodSpecFromMetadata(meta());
    spec.inputs.at(0).shape.pop_back();
    EXPECT_THROW(schema::validateSpec(spec, meta(), "forward"), std::runtime_error);
}

TEST_F(MethodMetaTest, ValidateSpecRejectsWrongParameterCount) {
    auto spec = schema::methodSpecFromMetadata(meta());
    spec.inputs.push_back(spec.inputs.at(0));
    EXPECT_THROW(schema::validateSpec(spec, meta(), "forward"), std::runtime_error);
}

TEST_F(MethodMetaTest, ValidateSpecRejectsDynamicDimensionAboveTheCompiledBound) {
    // A range whose max exceeds the exported allocation bound would let a
    // caller drive the model past the memory the program reserved.
    auto spec = schema::methodSpecFromMetadata(meta());
    spec.inputs.at(0).shape.at(2) = schema::RangeDim{.min = 1, .max = 4096, .step = 1};
    EXPECT_THROW(schema::validateSpec(spec, meta(), "forward"), std::runtime_error);
}

TEST_F(MethodMetaTest, ValidateSpecRejectsMalformedDimensionDomains) {
    auto spec = schema::methodSpecFromMetadata(meta());
    spec.inputs.at(0).shape.at(2) = schema::RangeDim{.min = 10, .max = 1, .step = 1};
    EXPECT_THROW(schema::validateSpec(spec, meta(), "forward"), std::runtime_error);

    auto emptyEnum = schema::methodSpecFromMetadata(meta());
    emptyEnum.inputs.at(0).shape.at(2) = schema::EnumDim{.choices = {}};
    EXPECT_THROW(schema::validateSpec(emptyEnum, meta(), "forward"), std::runtime_error);
}

// --- The load path, exercised through JS -------------------------------------

using ModelTest = JsiTestEnv;

TEST_F(ModelTest, LoadsAProgramAndExposesItsPath) {
    EXPECT_EQ(evalString(std::format("{} return model.path;", loadFixtureJs())), kFixture);
}

TEST_F(ModelTest, ExposesTheSchemaToJs) {
    EXPECT_TRUE(evalBool(std::format(
        "{} return typeof model.schema.forward === 'object';", loadFixtureJs())));

    EXPECT_EQ(evalString(std::format(
                  "{} return model.schema.forward.inputs[0].kind;", loadFixtureJs())),
              "Tensor");
    EXPECT_EQ(evalString(std::format(
                  "{} return model.schema.forward.inputs[0].dtype;", loadFixtureJs())),
              "float32");
}

TEST_F(ModelTest, SerialisesConstantDimensionsInTheJsSchema) {
    auto shape = evalNumberArray(std::format(R"(
        {}
        return model.schema.forward.inputs[0].shape.map(d => d.value);
    )",
                                             loadFixtureJs()));
    EXPECT_TRUE(almostEqual(shape, {1, 3, 256, 256}));

    EXPECT_EQ(evalString(std::format(
                  "{} return model.schema.forward.inputs[0].shape[0].kind;", loadFixtureJs())),
              "constant");
}

TEST_F(ModelTest, ExposesBackendsToJs) {
    EXPECT_EQ(evalString(std::format(
                  "{} return model.backends.forward.join(',');", loadFixtureJs())),
              "XnnpackBackend");
}

TEST_F(ModelTest, ReportsAMissingFileAsAJsError) {
    auto message = evalThrowingMessage(
        "__rnexecutorch_jsi__.loadModel('/definitely/not/a/model.pte');");
    EXPECT_THAT(message, HasSubstr("loadModel"));
    EXPECT_THAT(message, HasSubstr("/definitely/not/a/model.pte"));
}

TEST_F(ModelTest, RejectsWrongArgumentCount) {
    EXPECT_THAT(evalThrowingMessage("__rnexecutorch_jsi__.loadModel();"),
                HasSubstr("Usage: loadModel(path)"));
}

TEST_F(ModelTest, RejectsANonStringPath) {
    EXPECT_THAT(evalThrowingMessage("__rnexecutorch_jsi__.loadModel(42);"),
                HasSubstr("must be a string"));
}

TEST_F(ModelTest, ExecuteRejectsWrongArgumentCount) {
    // Executing for real needs the XNNPACK delegate, but argument validation
    // happens before any of that.
    EXPECT_THAT(evalThrowingMessage(std::format("{} model.execute('forward');", loadFixtureJs())),
                HasSubstr("Usage: execute(methodName, inputs, outputTensors)"));
}

} // namespace
} // namespace rnexecutorch::tests
