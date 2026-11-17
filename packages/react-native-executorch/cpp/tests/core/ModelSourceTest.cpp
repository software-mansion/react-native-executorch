#include <cstring>
#include <filesystem>
#include <format>
#include <fstream>
#include <iterator>
#include <string>
#include <vector>

#include "core/model.h"
#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

std::string fixturePath() {
#ifdef RNE_MODEL_FIXTURE
    return RNE_MODEL_FIXTURE;
#else
    // Standalone compiler checks do not receive CMake's test definitions.
    return (std::filesystem::path(__FILE__).parent_path().parent_path() /
            "fixtures/selfie_segmentation_xnnpack_fp32.pte")
        .string();
#endif
}

class ModelSourceTest : public JsiTestEnv {
protected:
    void SetUp() override {
        JsiTestEnv::SetUp();
        std::ifstream input(fixturePath(), std::ios::binary);
        ASSERT_TRUE(input.is_open());
        const std::vector<char> bytes{std::istreambuf_iterator<char>(input), std::istreambuf_iterator<char>()};
        ASSERT_FALSE(bytes.empty());
        ASSERT_FALSE(input.bad());
        auto buffer = rt().global().getPropertyAsFunction(rt(), "ArrayBuffer").callAsConstructor(rt(), static_cast<double>(bytes.size())).getObject(rt());
        std::memcpy(buffer.getArrayBuffer(rt()).data(rt()), bytes.data(), bytes.size());
        rt().global().setProperty(rt(), "programBytes", std::move(buffer));
    }
};

TEST_F(ModelSourceTest, ReadsCallbackProgramAndReportsTheUnlinkedBackend) {
    auto thrown = evalThrowing(R"(
        globalThis.readCalls = 0;
        __rnexecutorch_jsi__.loadModel({ programLoader: {
            size() { return programBytes.byteLength; },
            load(offset, length) {
                readCalls++;
                return programBytes.slice(offset, offset + length);
            }
        } });
    )");
    // The same fixture fails eager filesystem loading in ModelTest: the host
    // build has no XNNPACK delegate. Reaching that error proves callback reads
    // supplied a valid program, rather than failing during source parsing.
    EXPECT_TRUE(isCodedError(thrown, "LOAD_FAILED", "method 'forward' runs on XnnpackBackend"));
    EXPECT_GT(evalNumber("return readCalls;"), 0);
}

TEST_F(ModelSourceTest, PreservesProgramLoaderErrors) {
    auto thrown = evalThrowing(R"(
        __rnexecutorch_jsi__.loadModel({ programLoader: {
            size() { return programBytes.byteLength; },
            load() { throw new Error('program decrypt failed'); }
        } });
    )");
    EXPECT_THAT(thrown.message, ::testing::HasSubstr("program decrypt failed"));
}

TEST_F(ModelSourceTest, PreservesExternalDataLoaderErrors) {
    auto thrown = evalThrowing(R"(
        __rnexecutorch_jsi__.loadModel({
            programLoader: {
                size() { return programBytes.byteLength; },
                load(offset, length) { return programBytes.slice(offset, offset + length); }
            },
            dataMapLoader: {
                size() { return 64; },
                load() { throw new Error('weights decrypt failed'); }
            }
        });
    )");
    EXPECT_THAT(thrown.message, ::testing::HasSubstr("weights decrypt failed"));
}

TEST_F(ModelSourceTest, KeepsMetadataAndDisposalIndependentOfTheLoadingRuntime) {
    auto value = eval(std::format(R"(
        return __rnexecutorch_jsi__.loadModel('{}', {{ eagerLoadMethods: false }});
    )",
                                  fixturePath()));
    auto host = value.getObject(rt()).getHostObject<core::model::ModelHostObject>(rt());
    value = jsi::Value::undefined();
    JsiTestEnv::TearDown();
    auto other = facebook::hermes::makeHermesRuntime();
    other->global().setProperty(*other, "model", jsi::Object::createFromHostObject(*other, std::move(host)));
    auto result = other->evaluateJavaScript(std::make_unique<jsi::StringBuffer>(R"(
        (function() {
            try { return model.backends.forward.join(','); }
            finally { model.dispose(); }
        })()
    )"),
                                            "other-runtime.js");
    EXPECT_EQ(result.asString(*other).utf8(*other), "XnnpackBackend");
}

TEST_F(ModelSourceTest, ContinuesToSupportLazyFilesystemLoading) {
    EXPECT_TRUE(evalBool(std::format(R"(
        const model = __rnexecutorch_jsi__.loadModel('{}', {{ eagerLoadMethods: false }});
        try {{
            return model.path === '{}' && model.schema.forward.inputs.length === 1 &&
                model.backends.forward.join(',') === 'XnnpackBackend';
        }} finally {{ model.dispose(); }}
    )",
                                     fixturePath(), fixturePath())));
}

} // namespace
} // namespace rnexecutorch::tests
