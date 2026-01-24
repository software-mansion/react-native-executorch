#include "BaseModelTests.h"
#include "TestUtils.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/voice_activity_detection/VoiceActivityDetection.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::voice_activity_detection;
using namespace test_utils;
using namespace model_tests;

constexpr auto VALID_VAD_MODEL_PATH = "fsmn-vad_xnnpack.pte";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<VoiceActivityDetection> {
  using ModelType = VoiceActivityDetection;

  static ModelType createValid() {
    return ModelType(VALID_VAD_MODEL_PATH, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    auto audio = loadAudioFromFile("test_audio_float.raw");
    (void)model.generate(audio);
  }
};
} // namespace model_tests

using VADTypes = ::testing::Types<VoiceActivityDetection>;
INSTANTIATE_TYPED_TEST_SUITE_P(VAD, CommonModelTest, VADTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(VADGenerateTests, SilenceReturnsNoSegments) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto silence = generateSilence(16000 * 5);
  auto segments = model.generate(silence);
  EXPECT_TRUE(segments.empty());
}

TEST(VADGenerateTests, EmptyAudioThrows) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  std::vector<float> emptyAudio;
  EXPECT_THROW((void)model.generate(emptyAudio), RnExecutorchError);
}

TEST(VADGenerateTests, TooShortAudioReturnsNoSegments) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto shortAudio = generateSilence(100);
  auto segments = model.generate(shortAudio);
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

TEST(VADGenerateTests, MultipleGeneratesWork) {
  VoiceActivityDetection model(VALID_VAD_MODEL_PATH, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  EXPECT_NO_THROW((void)model.generate(audio));
  EXPECT_NO_THROW((void)model.generate(audio));
  EXPECT_NO_THROW((void)model.generate(audio));
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
