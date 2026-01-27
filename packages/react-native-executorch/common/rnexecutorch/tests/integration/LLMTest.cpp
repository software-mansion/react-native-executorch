#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <memory>
#include <string>

#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/llm/LLM.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::llm;
using namespace model_tests;

constexpr auto kValidModelPath = "smolLm2_135M_8da4w.pte";
constexpr auto kValidTokenizerPath = "smollm_tokenizer.json";
constexpr auto kSystemPrompt = "You are a helpful assistant. Assist the user "
                               "to the best of your abilities.";

// Forward declaration from jsi_stubs.cpp
namespace rnexecutorch {
std::shared_ptr<facebook::react::CallInvoker> createMockCallInvoker();
}

// Helper to format prompt in ChatML format for SmolLM2
std::string formatChatML(const std::string &systemPrompt,
                         const std::string &userMessage) {
  return "<|im_start|>system\n" + systemPrompt + "<|im_end|>\n" +
         "<|im_start|>user\n" + userMessage + "<|im_end|>\n" +
         "<|im_start|>assistant\n";
}

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<LLM> {
  using ModelType = LLM;

  static ModelType createValid() {
    return ModelType(kValidModelPath, kValidTokenizerPath,
                     rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", kValidTokenizerPath,
                     rnexecutorch::createMockCallInvoker());
  }

  static void callGenerate(ModelType &model) {
    std::string prompt = formatChatML(kSystemPrompt, "Hello");
    (void)model.generate(prompt, nullptr);
  }
};
} // namespace model_tests

using LLMTypes = ::testing::Types<LLM>;
INSTANTIATE_TYPED_TEST_SUITE_P(LLM, CommonModelTest, LLMTypes);

// ============================================================================
// LLM-specific fixture tests
// ============================================================================
class LLMTest : public ::testing::Test {
protected:
  std::shared_ptr<facebook::react::CallInvoker> mockInvoker_;

  void SetUp() override { mockInvoker_ = createMockCallInvoker(); }
};

TEST(LLMCtorTests, InvalidTokenizerPathThrows) {
  EXPECT_THROW(LLM(kValidModelPath, "nonexistent_tokenizer.json",
                   createMockCallInvoker()),
               RnExecutorchError);
}

TEST_F(LLMTest, GetGeneratedTokenCountInitiallyZero) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_EQ(model.getGeneratedTokenCount(), 0);
}

TEST_F(LLMTest, SetTemperature) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  // Should not throw for valid values
  EXPECT_NO_THROW(model.setTemperature(0.5f));
  EXPECT_NO_THROW(model.setTemperature(1.0f));
  EXPECT_NO_THROW(model.setTemperature(0.0f));
}

TEST_F(LLMTest, SetTemperatureNegativeThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_THROW(model.setTemperature(-0.1f), RnExecutorchError);
}

TEST_F(LLMTest, SetTopp) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_NO_THROW(model.setTopp(0.9f));
  EXPECT_NO_THROW(model.setTopp(0.5f));
  EXPECT_NO_THROW(model.setTopp(1.0f));
}

TEST_F(LLMTest, SetToppInvalidThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_THROW(model.setTopp(-0.1f), RnExecutorchError);
  EXPECT_THROW(model.setTopp(1.1f), RnExecutorchError);
}

TEST_F(LLMTest, SetCountInterval) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_NO_THROW(model.setCountInterval(5));
  EXPECT_NO_THROW(model.setCountInterval(10));
}

TEST_F(LLMTest, SetTimeInterval) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_NO_THROW(model.setTimeInterval(100));
  EXPECT_NO_THROW(model.setTimeInterval(500));
}

TEST_F(LLMTest, InterruptThrowsWhenUnloaded) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  model.unload();
  EXPECT_THROW(model.interrupt(), RnExecutorchError);
}

TEST_F(LLMTest, SettersThrowWhenUnloaded) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  model.unload();
  // All setters should throw when model is unloaded
  EXPECT_THROW(model.setTemperature(0.5f), RnExecutorchError);
  EXPECT_THROW(model.setTopp(0.9f), RnExecutorchError);
  EXPECT_THROW(model.setCountInterval(5), RnExecutorchError);
  EXPECT_THROW(model.setTimeInterval(100), RnExecutorchError);
}

TEST_F(LLMTest, GenerateProducesValidOutput) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  model.setTemperature(0.0f);
  std::string prompt =
      formatChatML(kSystemPrompt, "Repeat exactly this: `naszponcilem testy`");
  std::string output = model.generate(prompt, nullptr);
  EXPECT_EQ(output, "`naszponcilem testy`<|im_end|>");
}

TEST_F(LLMTest, GenerateUpdatesTokenCount) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_EQ(model.getGeneratedTokenCount(), 0);
  std::string prompt =
      formatChatML(kSystemPrompt, "Repeat exactly this: 'naszponcilem testy'");
  model.generate(prompt, nullptr);
  EXPECT_GT(model.getGeneratedTokenCount(), 0);
}

TEST_F(LLMTest, EmptyPromptThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, mockInvoker_);
  EXPECT_THROW((void)model.generate("", nullptr), RnExecutorchError);
}
