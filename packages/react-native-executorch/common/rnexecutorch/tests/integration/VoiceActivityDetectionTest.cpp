#include "BaseModelTests.h"
#include "utils/TestUtils.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/voice_activity_detection/VoiceActivityDetection.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::voice_activity_detection;
using namespace test_utils;
using namespace model_tests;

constexpr auto kValidVadModelPath = "fsmn-vad_xnnpack.pte";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<VoiceActivityDetection> {
  using ModelType = VoiceActivityDetection;

  static ModelType createValid() {
    return ModelType(kValidVadModelPath, nullptr);
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
  VoiceActivityDetection model(kValidVadModelPath, nullptr);
  auto silence = generateSilence(16000 * 5);
  auto segments = model.generate(silence);
  EXPECT_TRUE(segments.empty());
}

TEST(VADGenerateTests, SegmentsHaveValidBounds) {
  VoiceActivityDetection model(kValidVadModelPath, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto segments = model.generate(audio);

  for (const auto &segment : segments) {
    EXPECT_LE(segment.start, segment.end);
    EXPECT_LE(segment.end, audio.size());
  }
}

TEST(VADGenerateTests, SegmentsAreNonOverlapping) {
  VoiceActivityDetection model(kValidVadModelPath, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto segments = model.generate(audio);
  for (size_t i = 1; i < segments.size(); ++i) {
    EXPECT_LE(segments[i - 1].end, segments[i].start);
  }
}

TEST(VADGenerateTests, LongAudioSegmentBoundsValid) {
  VoiceActivityDetection model(kValidVadModelPath, nullptr);
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());
  auto segments = model.generate(audio);

  for (const auto &segment : segments) {
    EXPECT_LE(segment.start, segment.end);
    EXPECT_LE(segment.end, audio.size());
  }
}

TEST(VADInheritedTests, GetInputShapeWorks) {
  VoiceActivityDetection model(kValidVadModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_GE(shape.size(), 2u);
}

TEST(VADInheritedTests, GetAllInputShapesWorks) {
  VoiceActivityDetection model(kValidVadModelPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(VADInheritedTests, GetMethodMetaWorks) {
  VoiceActivityDetection model(kValidVadModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}
