#include "TestUtils.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/voice_activity_detection/VoiceActivityDetection.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::voice_activity_detection;
using namespace test_utils;

constexpr auto VALID_VAD_MODEL_PATH = "fsmn-vad_xnnpack.pte";

TEST(VADCtorTests, InvalidPathThrows) {
  EXPECT_THROW(VoiceActivityDetection("this_file_does_not_exist.pte", nullptr),
               RnExecutorchError);
}

TEST(VADCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(VoiceActivityDetection(VALID_VAD_MODEL_PATH, nullptr));
}

TEST(VADGenerateTests, SilenceReturnsNoSegments) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto silence = generateSilence(16000 * 5);
  auto segments = model.generate(silence);
  EXPECT_TRUE(segments.empty());
}

TEST(VADGenerateTests, SegmentsHaveValidBounds) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto segments = model.generate(audio);

  for (const auto &segment : segments) {
    EXPECT_LE(segment.start, segment.end);
    EXPECT_LE(segment.end, audio.size());
  }
}

TEST(VADGenerateTests, SegmentsAreNonOverlapping) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto segments = model.generate(audio);
  for (size_t i = 1; i < segments.size(); ++i) {
    EXPECT_LE(segments[i - 1].end, segments[i].start);
  }
}

TEST(VADGenerateTests, LongAudioSegmentBoundsValid) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto segments = model.generate(audio);

  for (const auto &segment : segments) {
    EXPECT_LE(segment.start, segment.end);
    EXPECT_LE(segment.end, audio.size());
  }
}

TEST(VADUnloadTests, GenerateAfterUnloadThrows) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  model.unload();
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  EXPECT_THROW((void)model.generate(audio), RnExecutorchError);
}

TEST(VADInheritedTests, GetInputShapeWorks) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_GE(shape.size(), 2u);
}

TEST(VADInheritedTests, GetAllInputShapesWorks) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(VADInheritedTests, GetMethodMetaWorks) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(VADInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}
