#include "BaseModelTests.h"
#include "utils/TestUtils.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::speech_to_text;
using namespace test_utils;
using namespace model_tests;

constexpr auto kValidModelPath = "whisper_tiny_en_xnnpack.pte";
constexpr auto kValidTokenizerPath = "whisper_tokenizer.json";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<SpeechToText> {
  using ModelType = SpeechToText;

  static ModelType createValid() {
    return ModelType("whisper", kValidModelPath, kValidTokenizerPath, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("whisper", "nonexistent.pte", kValidTokenizerPath,
                     nullptr);
  }

  static void callGenerate(ModelType &model) {
    auto audio = test_utils::loadAudioFromFile("test_audio_float.raw");
    (void)model.transcribe(audio, "en", false);
  }
};
} // namespace model_tests

using SpeechToTextTypes = ::testing::Types<SpeechToText>;
INSTANTIATE_TYPED_TEST_SUITE_P(SpeechToText, CommonModelTest,
                               SpeechToTextTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(S2TCtorTests, InvalidModelNameThrows) {
  EXPECT_THROW(SpeechToText("invalid_model", kValidModelPath,
                            kValidTokenizerPath, nullptr),
               RnExecutorchError);
}

TEST(S2TCtorTests, InvalidModelPathThrows) {
  EXPECT_THROW(
      SpeechToText("whisper", "nonexistent.pte", kValidTokenizerPath, nullptr),
      RnExecutorchError);
}

TEST(S2TCtorTests, InvalidTokenizerPathThrows) {
  EXPECT_THROW(
      SpeechToText("whisper", kValidModelPath, "nonexistent.json", nullptr),
      std::filesystem::filesystem_error);
}

TEST(S2TEncodeTests, EncodeReturnsNonNull) {
  SpeechToText model("whisper", kValidModelPath, kValidTokenizerPath, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto result = model.encode(audio);
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(S2TTranscribeTests, TranscribeReturnsValidChars) {
  SpeechToText model("whisper", kValidModelPath, kValidTokenizerPath, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto result = model.transcribe(audio, "en", true);
  ASSERT_EQ(result.language, "en");
  EXPECT_GE(result.duration, 20.0f);
  ASSERT_EQ(result.task, "transcribe");
  ASSERT_FALSE(result.segments.empty());
  ASSERT_FALSE(result.text.empty());
  for (char c : result.text) {
    EXPECT_GE(static_cast<unsigned char>(c), 0);
    EXPECT_LE(static_cast<unsigned char>(c), 127);
  }
}

TEST(S2TTranscribeTests, EmptyResultOnSilence) {
  SpeechToText model("whisper", kValidModelPath, kValidTokenizerPath, nullptr);
  auto audio = generateSilence(16000 * 5);
  auto result = model.transcribe(audio, "en", false);
  EXPECT_TRUE(result.text.empty());
}

TEST(S2TTranscribeTests, InvalidLanguageThrows) {
  SpeechToText model("whisper", kValidModelPath, kValidTokenizerPath, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  EXPECT_THROW((void)model.transcribe(audio, "invalid_language_code", false),
               RnExecutorchError);
}
