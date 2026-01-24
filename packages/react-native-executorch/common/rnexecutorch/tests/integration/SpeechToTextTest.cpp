#include "BaseModelTests.h"
#include "TestUtils.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::speech_to_text;
using namespace test_utils;
using namespace model_tests;

constexpr auto VALID_ENCODER_PATH = "whisper_tiny_en_encoder_xnnpack.pte";
constexpr auto VALID_DECODER_PATH = "whisper_tiny_en_decoder_xnnpack.pte";
constexpr auto VALID_TOKENIZER_PATH = "whisper_tokenizer.json";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<SpeechToText> {
  using ModelType = SpeechToText;

  static ModelType createValid() {
    return ModelType(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  }

  static void callGenerate(ModelType &model) {
    auto audio = test_utils::loadAudioFromFile("test_audio_float.raw");
    (void)model.transcribe(audio, "en");
  }
};
} // namespace model_tests

using SpeechToTextTypes = ::testing::Types<SpeechToText>;
INSTANTIATE_TYPED_TEST_SUITE_P(SpeechToText, CommonModelTest,
                               SpeechToTextTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(S2TCtorTests, InvalidDecoderPathThrows) {
  EXPECT_THROW(SpeechToText(VALID_ENCODER_PATH, "nonexistent.pte",
                            VALID_TOKENIZER_PATH, nullptr),
               RnExecutorchError);
}

TEST(S2TCtorTests, InvalidTokenizerPathThrows) {
  EXPECT_THROW(SpeechToText(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                            "nonexistent.json", nullptr),
               RnExecutorchError);
}

TEST(S2TEncodeTests, EncodeReturnsNonNull) {
  SpeechToText model(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto result = model.encode(audio);
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(S2TTranscribeTests, TranscribeReturnsValidChars) {
  SpeechToText model(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto result = model.transcribe(audio, "en");
  ASSERT_FALSE(result.empty());
  for (char c : result) {
    EXPECT_GE(static_cast<unsigned char>(c), 0);
    EXPECT_LE(static_cast<unsigned char>(c), 127);
  }
}

TEST(S2TTranscribeTests, EmptyResultOnSilence) {
  SpeechToText model(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  auto audio = generateSilence(16000 * 5);
  auto result = model.transcribe(audio, "en");
  EXPECT_TRUE(result.empty());
}

TEST(S2TTranscribeTests, InvalidLanguageThrows) {
  SpeechToText model(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  EXPECT_THROW((void)model.transcribe(audio, "invalid_language_code"),
               RnExecutorchError);
}

TEST(S2TTranscribeTests, EmptyLanguageThrows) {
  SpeechToText model(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  EXPECT_THROW((void)model.transcribe(audio, ""), RnExecutorchError);
}
