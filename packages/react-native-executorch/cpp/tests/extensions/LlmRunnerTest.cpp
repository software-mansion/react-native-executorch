#include <string>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using ::testing::HasSubstr;

// The llm extension wraps ExecuTorch's LLM runner. Creating one loads a real
// model and a real tokenizer, and running one needs the delegate the model was
// exported against — the same limit ModelTest documents for execute(). What is
// host-testable is everything up to that: the argument contract of
// createLLMRunner and how each failure to load is classified.
class LlmRunnerTest : public JsiTestEnv {};

TEST_F(LlmRunnerTest, IsInstalledUnderTheLlmNamespace) {
    EXPECT_TRUE(evalBool("return typeof __rnexecutorch_jsi__.llm.createLLMRunner === 'function';"));
    // Arity is what the TS layer's `.length` checks and what JS engines report;
    // the two optional arguments are not counted.
    EXPECT_EQ(evalNumber("return __rnexecutorch_jsi__.llm.createLLMRunner.length;"), 2);
}

TEST_F(LlmRunnerTest, RejectsWrongArgumentCounts) {
    const std::string usage = "Usage: createLLMRunner(modelPath, tokenizerPath, modalities?)";

    EXPECT_TRUE(isCodedError(evalThrowing("__rnexecutorch_jsi__.llm.createLLMRunner();"),
                             "INVALID_ARGUMENT", usage));
    EXPECT_TRUE(isCodedError(evalThrowing("__rnexecutorch_jsi__.llm.createLLMRunner('model.pte');"),
                             "INVALID_ARGUMENT", usage));
    // modalities is the last accepted argument, so a fourth is a mistake rather
    // than something to ignore.
    EXPECT_TRUE(isCodedError(
        evalThrowing("__rnexecutorch_jsi__.llm.createLLMRunner('a.pte', 'b.json', [], 'extra');"),
        "INVALID_ARGUMENT", usage));
}

TEST_F(LlmRunnerTest, RejectsWronglyTypedArguments) {
    EXPECT_TRUE(isCodedError(evalThrowing("__rnexecutorch_jsi__.llm.createLLMRunner(1, 'b.json');"),
                             "INVALID_ARGUMENT", "modelPath must be a string"));
    EXPECT_TRUE(isCodedError(evalThrowing("__rnexecutorch_jsi__.llm.createLLMRunner('a.pte', 2);"),
                             "INVALID_ARGUMENT", "tokenizerPath must be a string"));
    EXPECT_TRUE(isCodedError(
        evalThrowing("__rnexecutorch_jsi__.llm.createLLMRunner('a.pte', 'b.json', 'image');"),
        "INVALID_ARGUMENT", "modalities must be an Array"));
    EXPECT_TRUE(isCodedError(
        evalThrowing("__rnexecutorch_jsi__.llm.createLLMRunner('a.pte', 'b.json', [7]);"),
        "INVALID_ARGUMENT", "must be a string"));
}

// null and undefined mean "text only", so they must reach the tokenizer load
// rather than being rejected as a bad modalities list.
TEST_F(LlmRunnerTest, TreatsAbsentModalitiesAsTextOnly) {
    for (const auto *modalities : {"null", "undefined"}) {
        auto thrown = evalThrowing(
            std::string("__rnexecutorch_jsi__.llm.createLLMRunner('/no/model.pte', '/no/tokenizer.json', ") +
            modalities + ");");
        EXPECT_TRUE(isCodedError(thrown, "LOAD_FAILED", "/no/tokenizer.json")) << "modalities: " << modalities;
    }
}

// The tokenizer is loaded before the model, so a missing one is reported as
// such instead of as a confusing model failure.
TEST_F(LlmRunnerTest, ReportsAMissingTokenizerAsLoadFailed) {
    auto thrown = evalThrowing(
        "__rnexecutorch_jsi__.llm.createLLMRunner('/no/model.pte', '/no/tokenizer.json');");

    EXPECT_TRUE(isCodedError(thrown, "LOAD_FAILED", "Failed to load runner tokenizer"));
    EXPECT_THAT(thrown.message, HasSubstr("/no/tokenizer.json"));
}

#ifdef RNE_TOKENIZER_FIXTURE
// With a loadable tokenizer the failure moves on to the model, which is the
// point: the two load steps are classified separately rather than collapsed.
TEST_F(LlmRunnerTest, ReportsAMissingModelAsLoadFailed) {
    auto thrown = evalThrowing(
        std::string("__rnexecutorch_jsi__.llm.createLLMRunner('/no/model.pte', '") +
        RNE_TOKENIZER_FIXTURE + "');");

    EXPECT_EQ(thrown.code, "LOAD_FAILED");
    EXPECT_THAT(thrown.message, HasSubstr("LLMRunner:"));
    EXPECT_THAT(thrown.message, ::testing::Not(HasSubstr("tokenizer")));
}

TEST_F(LlmRunnerTest, ReportsAMissingMultimodalModelAsLoadFailed) {
    auto thrown = evalThrowing(
        std::string("__rnexecutorch_jsi__.llm.createLLMRunner('/no/model.pte', '") +
        RNE_TOKENIZER_FIXTURE + "', ['image']);");

    EXPECT_EQ(thrown.code, "LOAD_FAILED");
    EXPECT_THAT(thrown.message, HasSubstr("LLMRunner:"));
}
#endif

} // namespace
} // namespace rnexecutorch::tests
