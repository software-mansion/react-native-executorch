#include <cstdint>
#include <cstring>
#include <filesystem>
#include <format>
#include <fstream>
#include <vector>

#include "core/model.h"
#include "support/JsiTestEnv.h"

#include <executorch/schema/program_generated.h>

namespace rnexecutorch::tests {
namespace {
namespace fb = executorch_flatbuffer;

// Build an actual executable program without downloaded weights or a delegate.
// Its single method returns a constant integer, so the test exercises loading
// and inference without depending on kernel registration or device backends.
std::vector<uint8_t> constantProgram() {
    flatbuffers::FlatBufferBuilder builder;
    const std::vector<flatbuffers::Offset<fb::EValue>> values{
        fb::CreateEValue(builder, fb::KernelTypes::Int, fb::CreateInt(builder, 42).Union())};
    const std::vector<int32_t> inputs;
    const std::vector<int32_t> outputs{0};
    const std::vector<flatbuffers::Offset<fb::Instruction>> instructions;
    const auto chain = fb::CreateChainDirect(builder, &inputs, &outputs, &instructions);
    const std::vector<flatbuffers::Offset<fb::Chain>> chains{chain};
    const std::vector<flatbuffers::Offset<fb::Operator>> operators;
    const std::vector<flatbuffers::Offset<fb::BackendDelegate>> delegates;
    const std::vector<int64_t> buffers{0};
    const auto plan = fb::CreateExecutionPlanDirect(builder, "value", 0, &values, &inputs, &outputs,
                                                    &chains, &operators, &delegates, &buffers);
    const std::vector<flatbuffers::Offset<fb::ExecutionPlan>> plans{plan};
    const std::vector<flatbuffers::Offset<fb::Buffer>> constants;
    const std::vector<uint64_t> constantOffsets{0};
    const auto constantSegment = fb::CreateSubsegmentOffsetsDirect(builder, 0, &constantOffsets);
    fb::FinishProgramBuffer(builder, fb::CreateProgramDirect(builder, 0, &plans, &constants, nullptr, nullptr, constantSegment));
    return {builder.GetBufferPointer(), builder.GetBufferPointer() + builder.GetSize()};
}

class ModelSourceTest : public JsiTestEnv {
protected:
    void SetUp() override {
        JsiTestEnv::SetUp();
        const auto bytes = constantProgram();
        auto buffer = rt().global().getPropertyAsFunction(rt(), "ArrayBuffer").callAsConstructor(rt(), static_cast<double>(bytes.size())).getObject(rt());
        std::memcpy(buffer.getArrayBuffer(rt()).data(rt()), bytes.data(), bytes.size());
        rt().global().setProperty(rt(), "programBytes", std::move(buffer));
    }
};

TEST_F(ModelSourceTest, ExecutesRepeatedlyWithoutReadingCallbacksAfterInitialization) {
    EXPECT_TRUE(evalBool(R"(
        let active = true;
        let calls = 0;
        const reader = {
            size() { if (!active) throw new Error('late size'); return programBytes.byteLength; },
            load(offset, length) {
                if (!active) throw new Error('late read');
                calls++;
                return programBytes.slice(offset, offset + length);
            }
        };
        const model = __rnexecutorch_jsi__.loadModel({ programLoader: reader });
        active = false;
        const before = calls;
        try {
            return model.path === undefined && calls > 0 &&
                model.execute('value', [], [])[0] === 42 &&
                model.execute('value', [], [])[0] === 42 && calls === before;
        } finally { model.dispose(); }
    )"));
}

TEST_F(ModelSourceTest, ExecutesAndDisposesInAnotherRuntimeAfterLoadingRuntimeIsDestroyed) {
    auto value = eval(R"(
        return __rnexecutorch_jsi__.loadModel({ programLoader: {
            size() { return programBytes.byteLength; },
            load(offset, length) { return programBytes.slice(offset, offset + length); }
        } });
    )");
    auto host = value.getObject(rt()).getHostObject<core::model::ModelHostObject>(rt());
    value = jsi::Value::undefined();
    // Destroy the owner runtime before accessing the model from a new runtime.
    JsiTestEnv::TearDown();
    auto other = facebook::hermes::makeHermesRuntime();
    other->global().setProperty(*other, "model", jsi::Object::createFromHostObject(*other, std::move(host)));
    auto result = other->evaluateJavaScript(std::make_unique<jsi::StringBuffer>(R"(
        (function() {
            try { return model.execute('value', [], [])[0]; }
            finally { model.dispose(); }
        })()
    )"),
                                            "other-runtime.js");
    EXPECT_EQ(result.asNumber(), 42);
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

TEST_F(ModelSourceTest, ContinuesToSupportLazyFilesystemLoading) {
    const auto bytes = constantProgram();
    // Use a unique temporary filename; remove it even if an assertion throws.
    const auto path = std::filesystem::temp_directory_path() /
                      std::format("rne-model-source-{}.pte", reinterpret_cast<uintptr_t>(this));
    struct RemoveFile {
        std::filesystem::path path;
        ~RemoveFile() {
            std::error_code ignored;
            std::filesystem::remove(path, ignored);
        }
    } cleanup{path};
    {
        std::ofstream output(path, std::ios::binary);
        output.write(reinterpret_cast<const char *>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
        ASSERT_TRUE(output.good());
    }
    EXPECT_EQ(evalNumber(std::format(R"(
        const model = __rnexecutorch_jsi__.loadModel('{}', {{ eagerLoadMethods: false }});
        try {{ return model.execute('value', [], [])[0]; }} finally {{ model.dispose(); }}
    )",
                                     path.string())),
              42);
}

} // namespace
} // namespace rnexecutorch::tests
