#include "TestUtils.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::speech_to_text;
using namespace test_utils;

constexpr auto VALID_ENCODER_PATH = "whisper_tiny_en_encoder_xnnpack.pte";
constexpr auto VALID_DECODER_PATH = "whisper_tiny_en_decoder_xnnpack.pte";
constexpr auto VALID_TOKENIZER_PATH = "whisper_tokenizer.json";

TEST(S2TCtorTests, InvalidEncoderPathThrows) {
  EXPECT_THROW(SpeechToText("nonexistent.pte", VALID_DECODER_PATH,
                            VALID_TOKENIZER_PATH, nullptr),
               RnExecutorchError);
}

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

TEST(S2TCtorTests, ValidPathsDoesntThrow) {
  EXPECT_NO_THROW(SpeechToText(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                               VALID_TOKENIZER_PATH, nullptr));
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

TEST(S2TMemoryTests, MemoryLowerBoundIsPositive) {
  SpeechToText model(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(S2TUnloadTests, TranscribeAfterUnloadThrows) {
  SpeechToText model(VALID_ENCODER_PATH, VALID_DECODER_PATH,
                     VALID_TOKENIZER_PATH, nullptr);
  model.unload();
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  EXPECT_THROW((void)model.transcribe(audio, "en"), RnExecutorchError);
}
