#include "BaseModelTests.h"
#include "utils/TestUtils.h"
#include <gtest/gtest.h>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/llm/LLM.h>
#include <runner/encoders/audio_encoder.h>
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

// Helper to format a single-turn prompt in Gemma's chat template.
std::string formatGemma(const std::string &userMessage) {
  return "<start_of_turn>user\n" + userMessage + "<end_of_turn>\n" +
         "<start_of_turn>model\n";
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

TEST(AudioEncoderTest, LoadFailsWithClearErrorWhenMethodMissing) {
  // smolLm2_135M_8da4w.pte has no audio_encoder method
  auto module = std::make_unique<::executorch::extension::Module>(
      "smolLm2_135M_8da4w.pte",
      ::executorch::extension::Module::LoadMode::File);

  auto encoder =
      std::make_unique<executorch::extension::llm::AudioEncoder>(*module);

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
  // A text-only runner reports is_multimodal() == false, so any multimodal
  // call must be rejected before the inputs are even inspected.
  MultimodalInputs inputs{.images =
                              ImageInputs{.paths = {}, .token = "<image>"}};
  EXPECT_THROW(model.generateMultimodal("hello", nullptr, std::move(inputs)),
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
  MultimodalInputs inputs{
      .images = ImageInputs{.paths = {kTestImagePath}, .token = ""}};
  EXPECT_THROW(model_->generateMultimodal("hello", nullptr, std::move(inputs)),
               RnExecutorchError);
}

TEST_F(VLMTest, GenerateMultimodalMorePlaceholdersThanImagePaths) {
  std::string prompt = std::string(kVlmImageToken) + " and " + kVlmImageToken;
  MultimodalInputs inputs{.images = ImageInputs{.paths = {kTestImagePath},
                                                .token = kVlmImageToken}};
  EXPECT_THROW(model_->generateMultimodal(prompt, nullptr, std::move(inputs)),
               RnExecutorchError);
}

TEST_F(VLMTest, GenerateMultimodalMoreImagePathsThanPlaceholders) {
  std::string prompt = std::string(kVlmImageToken) + " describe";
  MultimodalInputs inputs{
      .images = ImageInputs{.paths = {kTestImagePath, kTestImagePath},
                            .token = kVlmImageToken}};
  EXPECT_THROW(model_->generateMultimodal(prompt, nullptr, std::move(inputs)),
               RnExecutorchError);
}

// ============================================================================
// Audio (Gemma 4) multimodal tests
// ============================================================================
constexpr auto kGemmaModelPath = "gemma4_e2b_mm_xnnpack.pte";
constexpr auto kGemmaTokenizerPath = "gemma_tokenizer.json";
constexpr auto kGemmaAudioToken = "<audio_soft_token>";
constexpr auto kTestAudioPath = "test_audio_float.raw";

// Fixture that loads the audio-capable Gemma model once for all audio tests.
class GemmaAudioTest : public ::testing::Test {
protected:
  static void SetUpTestSuite() {
    invoker_ = createMockCallInvoker();
    model_ = std::make_unique<LLM>(kGemmaModelPath, kGemmaTokenizerPath,
                                   std::vector<std::string>{"vision", "audio"},
                                   invoker_);
  }

  static void TearDownTestSuite() {
    model_.reset();
    invoker_.reset();
  }

  static std::vector<float> loadAudio(size_t maxSamples = 32000) {
    auto wav = test_utils::loadAudioFromFile(kTestAudioPath);
    if (wav.size() > maxSamples) {
      wav.resize(maxSamples);
    }
    return wav;
  }

  static std::shared_ptr<facebook::react::CallInvoker> invoker_;
  static std::unique_ptr<LLM> model_;
};

std::shared_ptr<facebook::react::CallInvoker> GemmaAudioTest::invoker_;
std::unique_ptr<LLM> GemmaAudioTest::model_;

TEST_F(GemmaAudioTest, GenerateMultimodalNoInputsThrows) {
  EXPECT_THROW(model_->generateMultimodal("hello", nullptr, {}),
               RnExecutorchError);
}

TEST_F(GemmaAudioTest, GenerateMultimodalEmptyAudioTokenThrows) {
  MultimodalInputs inputs{
      .audios = AudioInputs{.waveforms = {loadAudio()}, .token = ""}};
  EXPECT_THROW(model_->generateMultimodal("hello", nullptr, std::move(inputs)),
               RnExecutorchError);
}

TEST_F(GemmaAudioTest, GenerateMultimodalMorePlaceholdersThanWaveformsThrows) {
  std::string prompt =
      std::string(kGemmaAudioToken) + " and " + kGemmaAudioToken;
  MultimodalInputs inputs{.audios = AudioInputs{.waveforms = {loadAudio()},
                                                .token = kGemmaAudioToken}};
  EXPECT_THROW(model_->generateMultimodal(prompt, nullptr, std::move(inputs)),
               RnExecutorchError);
}

TEST_F(GemmaAudioTest, GenerateMultimodalMoreWaveformsThanPlaceholdersThrows) {
  std::string prompt = std::string(kGemmaAudioToken) + " describe";
  MultimodalInputs inputs{
      .audios = AudioInputs{.waveforms = {loadAudio(), loadAudio()},
                            .token = kGemmaAudioToken}};
  EXPECT_THROW(model_->generateMultimodal(prompt, nullptr, std::move(inputs)),
               RnExecutorchError);
}

TEST_F(GemmaAudioTest, GenerateMultimodalAudioProducesOutput) {
  std::vector<float> wav = loadAudio();
  ASSERT_FALSE(wav.empty())
      << "test_audio_float.raw missing on device - check run_tests.sh assets";

  std::string prompt =
      formatGemma(std::string(kGemmaAudioToken) + " Transcribe the audio.");
  MultimodalInputs inputs{.audios = AudioInputs{.waveforms = {std::move(wav)},
                                                .token = kGemmaAudioToken}};
  std::string output =
      model_->generateMultimodal(prompt, nullptr, std::move(inputs));

  EXPECT_FALSE(output.empty());
  EXPECT_GT(model_->getGeneratedTokenCount(), 0);
}

TEST_F(GemmaAudioTest, GenerateMultimodalInterleavedTextAndAudio) {
  std::string prompt = formatGemma("Listen: " + std::string(kGemmaAudioToken) +
                                   " then summarise it.");
  MultimodalInputs inputs{.audios = AudioInputs{.waveforms = {loadAudio()},
                                                .token = kGemmaAudioToken}};
  std::string output =
      model_->generateMultimodal(prompt, nullptr, std::move(inputs));

  EXPECT_FALSE(output.empty());
}
