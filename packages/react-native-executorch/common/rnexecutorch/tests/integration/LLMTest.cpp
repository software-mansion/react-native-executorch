#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <memory>
#include <string>

#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/llm/LLM.h>
#include <runner/encoders/vision_encoder.h>

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
    return ModelType(kValidModelPath, kValidTokenizerPath, {},
                     rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", kValidTokenizerPath, {},
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
  EXPECT_THROW(LLM(kValidModelPath, "nonexistent_tokenizer.json", {},
                   createMockCallInvoker()),
               RnExecutorchError);
}

TEST(LLMCtorTests, WrongCapabilitiesThrowsClearError) {
  EXPECT_THROW(LLM(kValidModelPath, kValidTokenizerPath, {"vision"},
                   createMockCallInvoker()),
               rnexecutorch::RnExecutorchError);
}

TEST_F(LLMTest, GetGeneratedTokenCountInitiallyZero) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_EQ(model.getGeneratedTokenCount(), 0);
}

TEST_F(LLMTest, SetTemperature) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  // Should not throw for valid values
  EXPECT_NO_THROW(model.setTemperature(0.5f));
  EXPECT_NO_THROW(model.setTemperature(1.0f));
  EXPECT_NO_THROW(model.setTemperature(0.0f));
}

TEST_F(LLMTest, SetTemperatureNegativeThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_THROW(model.setTemperature(-0.1f), RnExecutorchError);
}

TEST_F(LLMTest, SetTopp) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_NO_THROW(model.setTopp(0.9f));
  EXPECT_NO_THROW(model.setTopp(0.5f));
  EXPECT_NO_THROW(model.setTopp(1.0f));
}

TEST_F(LLMTest, SetToppInvalidThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_THROW(model.setTopp(-0.1f), RnExecutorchError);
  EXPECT_THROW(model.setTopp(1.1f), RnExecutorchError);
}

TEST_F(LLMTest, SetMinP) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_NO_THROW(model.setMinP(0.0f));
  EXPECT_NO_THROW(model.setMinP(0.15f));
  EXPECT_NO_THROW(model.setMinP(1.0f));
}

TEST_F(LLMTest, SetMinPInvalidThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_THROW(model.setMinP(-0.1f), RnExecutorchError);
  EXPECT_THROW(model.setMinP(1.1f), RnExecutorchError);
}

TEST_F(LLMTest, SetRepetitionPenalty) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_NO_THROW(model.setRepetitionPenalty(1.0f));
  EXPECT_NO_THROW(model.setRepetitionPenalty(1.05f));
  EXPECT_NO_THROW(model.setRepetitionPenalty(2.0f));
}

TEST_F(LLMTest, SetRepetitionPenaltyInvalidThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_THROW(model.setRepetitionPenalty(-0.1f), RnExecutorchError);
}

TEST_F(LLMTest, SetCountInterval) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_NO_THROW(model.setCountInterval(5));
  EXPECT_NO_THROW(model.setCountInterval(10));
}

TEST_F(LLMTest, SetTimeInterval) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_NO_THROW(model.setTimeInterval(100));
  EXPECT_NO_THROW(model.setTimeInterval(500));
}

TEST_F(LLMTest, InterruptThrowsWhenUnloaded) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  model.unload();
  EXPECT_THROW(model.interrupt(), RnExecutorchError);
}

TEST_F(LLMTest, SettersThrowWhenUnloaded) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  model.unload();
  // All setters should throw when model is unloaded
  EXPECT_THROW(model.setTemperature(0.5f), RnExecutorchError);
  EXPECT_THROW(model.setTopp(0.9f), RnExecutorchError);
  EXPECT_THROW(model.setCountInterval(5), RnExecutorchError);
  EXPECT_THROW(model.setTimeInterval(100), RnExecutorchError);
}

TEST_F(LLMTest, GenerateProducesValidOutput) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  model.setTemperature(0.0f);
  std::string prompt =
      formatChatML(kSystemPrompt, "Repeat exactly this: `naszponcilem testy`");
  std::string output = model.generate(prompt, nullptr);
  EXPECT_EQ(output, "`naszponcilem testy`<|im_end|>");
}

TEST_F(LLMTest, GenerateUpdatesTokenCount) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_EQ(model.getGeneratedTokenCount(), 0);
  std::string prompt =
      formatChatML(kSystemPrompt, "Repeat exactly this: 'naszponcilem testy'");
  model.generate(prompt, nullptr);
  EXPECT_GT(model.getGeneratedTokenCount(), 0);
}

TEST_F(LLMTest, EmptyPromptThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_THROW((void)model.generate("", nullptr), RnExecutorchError);
}

TEST_F(LLMTest, CountTextTokensPositive) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_GT(model.countTextTokens("hello world"), 0);
}

TEST_F(LLMTest, CountTextTokensEmptyString) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_GE(model.countTextTokens(""), 0);
}

TEST_F(LLMTest, GetMaxContextLengthPositive) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_GT(model.getMaxContextLength(), 0);
}

TEST_F(LLMTest, ResetZerosGeneratedTokenCount) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  model.generate(formatChatML(kSystemPrompt, "Hi"), nullptr);
  EXPECT_GT(model.getGeneratedTokenCount(), 0);
  model.reset();
  EXPECT_EQ(model.getGeneratedTokenCount(), 0);
}

TEST_F(LLMTest, PromptTokenCountNonZeroAfterGenerate) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  model.generate(formatChatML(kSystemPrompt, "Hi"), nullptr);
  EXPECT_GT(model.getPromptTokenCount(), 0);
}

TEST(VisionEncoderTest, LoadFailsWithClearErrorWhenMethodMissing) {
  // smolLm2_135M_8da4w.pte has no vision_encoder method
  auto module = std::make_unique<::executorch::extension::Module>(
      "smolLm2_135M_8da4w.pte",
      ::executorch::extension::Module::LoadMode::File);

  auto encoder =
      std::make_unique<executorch::extension::llm::VisionEncoder>(*module);

  EXPECT_THROW(encoder->load(), rnexecutorch::RnExecutorchError);
}

// ============================================================================
// VLM-specific tests
// ============================================================================
constexpr auto kVlmModelPath = "lfm2_5_vl_quantized_xnnpack_v2.pte";
constexpr auto kVlmTokenizerPath = "lfm2_vl_tokenizer.json";
constexpr auto kVlmImageToken = "<image>";
constexpr auto kTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

TEST_F(LLMTest, TextModelIsNotMultimodal) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_EQ(model.getVisualTokenCount(), 0);
}

TEST_F(LLMTest, GenerateMultimodalOnTextModelThrows) {
  LLM model(kValidModelPath, kValidTokenizerPath, {}, mockInvoker_);
  EXPECT_THROW(model.generateMultimodal("hello", {}, "<image>", nullptr),
               RnExecutorchError);
}

// Fixture that loads the VLM model once for all VLM tests
class VLMTest : public ::testing::Test {
protected:
  static void SetUpTestSuite() {
    invoker_ = createMockCallInvoker();
    model_ =
        std::make_unique<LLM>(kVlmModelPath, kVlmTokenizerPath,
                              std::vector<std::string>{"vision"}, invoker_);
  }

  static void TearDownTestSuite() {
    model_.reset();
    invoker_.reset();
  }

  static std::shared_ptr<facebook::react::CallInvoker> invoker_;
  static std::unique_ptr<LLM> model_;
};

std::shared_ptr<facebook::react::CallInvoker> VLMTest::invoker_;
std::unique_ptr<LLM> VLMTest::model_;

TEST_F(VLMTest, GenerateMultimodalEmptyImageTokenThrows) {
  EXPECT_THROW(
      model_->generateMultimodal("hello", {kTestImagePath}, "", nullptr),
      RnExecutorchError);
}

TEST_F(VLMTest, GenerateMultimodalMorePlaceholdersThanImagePaths) {
  std::string prompt = std::string(kVlmImageToken) + " and " + kVlmImageToken;
  EXPECT_THROW(model_->generateMultimodal(prompt, {kTestImagePath},
                                          kVlmImageToken, nullptr),
               RnExecutorchError);
}

TEST_F(VLMTest, GenerateMultimodalMoreImagePathsThanPlaceholders) {
  std::string prompt = std::string(kVlmImageToken) + " describe";
  EXPECT_THROW(model_->generateMultimodal(prompt,
                                          {kTestImagePath, kTestImagePath},
                                          kVlmImageToken, nullptr),
               RnExecutorchError);
}
