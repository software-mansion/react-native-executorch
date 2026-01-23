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

constexpr auto VALID_MODEL_PATH = "smolLm2_135M_8da4w.pte";
constexpr auto VALID_TOKENIZER_PATH = "smollm_tokenizer.json";
constexpr auto SYSTEM_PROMPT = "You are a helpful assistant. Assist the user "
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
    return ModelType(VALID_MODEL_PATH, VALID_TOKENIZER_PATH,
                     rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", VALID_TOKENIZER_PATH,
                     rnexecutorch::createMockCallInvoker());
  }

  static void callGenerate(ModelType &model) {
    std::string prompt = formatChatML(SYSTEM_PROMPT, "Hello");
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

TEST_F(LLMTest, GetGeneratedTokenCountInitiallyZero) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  EXPECT_EQ(model.getGeneratedTokenCount(), 0);
}

TEST_F(LLMTest, SetTemperature) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  // Should not throw
  EXPECT_NO_THROW(model.setTemperature(0.5f));
  EXPECT_NO_THROW(model.setTemperature(1.0f));
  EXPECT_NO_THROW(model.setTemperature(0.0f));
}

TEST_F(LLMTest, SetTopp) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  EXPECT_NO_THROW(model.setTopp(0.9f));
  EXPECT_NO_THROW(model.setTopp(0.5f));
  EXPECT_NO_THROW(model.setTopp(1.0f));
}

TEST_F(LLMTest, SetCountInterval) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  EXPECT_NO_THROW(model.setCountInterval(5));
  EXPECT_NO_THROW(model.setCountInterval(10));
}

TEST_F(LLMTest, SetTimeInterval) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  EXPECT_NO_THROW(model.setTimeInterval(100));
  EXPECT_NO_THROW(model.setTimeInterval(500));
}

TEST_F(LLMTest, InterruptThrowsWhenUnloaded) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  model.unload();
  EXPECT_THROW(model.interrupt(), RnExecutorchError);
}

TEST_F(LLMTest, SettersThrowWhenUnloaded) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  model.unload();
  // All setters should throw when model is unloaded
  EXPECT_THROW(model.setTemperature(0.5f), RnExecutorchError);
  EXPECT_THROW(model.setTopp(0.9f), RnExecutorchError);
  EXPECT_THROW(model.setCountInterval(5), RnExecutorchError);
  EXPECT_THROW(model.setTimeInterval(100), RnExecutorchError);
}

TEST_F(LLMTest, GenerateProducesValidOutput) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  model.setTemperature(0.0f);
  std::string prompt =
      formatChatML(SYSTEM_PROMPT, "Repeat exactly this: `naszponcilem testy`");
  std::string output = model.generate(prompt, nullptr);
  EXPECT_EQ(output, "`naszponcilem testy`<|im_end|>");
}

TEST_F(LLMTest, GenerateUpdatesTokenCount) {
  LLM model(VALID_MODEL_PATH, VALID_TOKENIZER_PATH, mockInvoker_);
  EXPECT_EQ(model.getGeneratedTokenCount(), 0);
  std::string prompt =
      formatChatML(SYSTEM_PROMPT, "Repeat exactly this: 'naszponcilem testy'");
  model.generate(prompt, nullptr);
  EXPECT_GT(model.getGeneratedTokenCount(), 0);
}
