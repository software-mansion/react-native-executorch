#include "BaseModelTests.h"
#include "utils/TestUtils.h"
#include <chrono>
#include <gtest/gtest.h>
#include <jsi/jsi.h>
#include <memory>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/voice_activity_detection/Utils.h>
#include <rnexecutorch/models/voice_activity_detection/VoiceActivityDetection.h>
#include <thread>

namespace rnexecutorch {
std::shared_ptr<facebook::react::CallInvoker> createMockCallInvoker();
}

using namespace rnexecutorch;
using namespace rnexecutorch::models::voice_activity_detection;
using namespace test_utils;
using namespace model_tests;

namespace vad_utils = rnexecutorch::models::voice_activity_detection::utils;

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

// ============================================================================
// utils::mergeSegments unit tests (no model load needed)
// ============================================================================
TEST(VADMergeSegmentsTests, EmptyInputReturnsEmpty) {
  std::vector<types::Segment> empty;
  EXPECT_TRUE(vad_utils::mergeSegments(empty, /*maxMergeGap=*/100).empty());
}

TEST(VADMergeSegmentsTests, SingleSegmentReturnedUnchanged) {
  std::vector<types::Segment> input = {{100, 500}};
  auto merged = vad_utils::mergeSegments(input, /*maxMergeGap=*/100);
  ASSERT_EQ(merged.size(), 1u);
  EXPECT_EQ(merged[0].start, 100u);
  EXPECT_EQ(merged[0].end, 500u);
}

TEST(VADMergeSegmentsTests, DistantSegmentsStaySeparate) {
  // Gap between segments (1000 - 500 = 500) is larger than maxMergeGap (100).
  std::vector<types::Segment> input = {{0, 500}, {1000, 1500}};
  auto merged = vad_utils::mergeSegments(input, /*maxMergeGap=*/100);
  ASSERT_EQ(merged.size(), 2u);
  EXPECT_EQ(merged[0].end, 500u);
  EXPECT_EQ(merged[1].start, 1000u);
}

TEST(VADMergeSegmentsTests, CloseSegmentsAreMerged) {
  // Gap (510 - 500 = 10) is within maxMergeGap (100).
  std::vector<types::Segment> input = {{0, 500}, {510, 1000}};
  auto merged = vad_utils::mergeSegments(input, /*maxMergeGap=*/100);
  ASSERT_EQ(merged.size(), 1u);
  EXPECT_EQ(merged[0].start, 0u);
  EXPECT_EQ(merged[0].end, 1000u);
}

TEST(VADMergeSegmentsTests, AdjacentSegmentsAreMerged) {
  // Gap of 0 is <= maxMergeGap (0).
  std::vector<types::Segment> input = {{0, 500}, {500, 1000}};
  auto merged = vad_utils::mergeSegments(input, /*maxMergeGap=*/0);
  ASSERT_EQ(merged.size(), 1u);
  EXPECT_EQ(merged[0].start, 0u);
  EXPECT_EQ(merged[0].end, 1000u);
}

TEST(VADMergeSegmentsTests, OverlappingShorterInnerDoesNotShrink) {
  // Second segment overlaps inside the first. Merged result must not shrink.
  std::vector<types::Segment> input = {{0, 1000}, {200, 500}};
  auto merged = vad_utils::mergeSegments(input, /*maxMergeGap=*/0);
  ASSERT_EQ(merged.size(), 1u);
  EXPECT_EQ(merged[0].start, 0u);
  EXPECT_EQ(merged[0].end, 1000u);
}

TEST(VADMergeSegmentsTests, MixedSequenceMergesOnlyAdjacentClose) {
  // First two are close enough to merge; third is far.
  std::vector<types::Segment> input = {{0, 500}, {520, 800}, {2000, 2500}};
  auto merged = vad_utils::mergeSegments(input, /*maxMergeGap=*/100);
  ASSERT_EQ(merged.size(), 2u);
  EXPECT_EQ(merged[0].start, 0u);
  EXPECT_EQ(merged[0].end, 800u);
  EXPECT_EQ(merged[1].start, 2000u);
  EXPECT_EQ(merged[1].end, 2500u);
}

// ============================================================================
// Streaming lifecycle tests
//
// VAD::stream() blocks on its own loop until streamStop() flips the flag, so
// every test below drives it from a background thread and joins after stop.
// The native callback round-trips through the CallInvoker — using the no-op
// MockCallInvoker means callbacks are dropped but the streaming loop itself
// still runs normally.
// ============================================================================
TEST(VADStreamTests, StreamStopExitsLoop) {
  VoiceActivityDetection model(kValidVadModelPath, createMockCallInvoker());
  std::thread streamer([&model] {
    model.stream(std::shared_ptr<jsi::Function>(), /*timeout=*/50,
                 /*detectionMargin=*/100);
  });

  // Let the loop spin a few iterations before stopping.
  std::this_thread::sleep_for(std::chrono::milliseconds(200));
  const auto stopRequestedAt = std::chrono::steady_clock::now();
  model.streamStop();
  streamer.join();
  const auto elapsedToStop = std::chrono::steady_clock::now() - stopRequestedAt;

  // streamStop() should wake the wait_for() and return quickly (well below
  // the timeout window — give a generous safety margin).
  EXPECT_LT(elapsedToStop, std::chrono::milliseconds(500));
}

TEST(VADStreamTests, StreamInsertWhileStreamingDoesNotCrash) {
  VoiceActivityDetection model(kValidVadModelPath, createMockCallInvoker());
  std::thread streamer([&model] {
    model.stream(std::shared_ptr<jsi::Function>(), /*timeout=*/50,
                 /*detectionMargin=*/100);
  });

  auto silence = generateSilence(16000); // 1s
  auto audio = loadAudioFromFile("test_audio_float.raw");
  ASSERT_FALSE(audio.empty());

  model.streamInsert(silence);
  std::this_thread::sleep_for(std::chrono::milliseconds(150));
  model.streamInsert(audio);
  std::this_thread::sleep_for(std::chrono::milliseconds(300));

  model.streamStop();
  streamer.join();
}

TEST(VADStreamTests, ConcurrentStreamCallThrows) {
  VoiceActivityDetection model(kValidVadModelPath, createMockCallInvoker());
  std::thread streamer([&model] {
    model.stream(std::shared_ptr<jsi::Function>(), /*timeout=*/50,
                 /*detectionMargin=*/100);
  });

  // Give the first call time to flip isStreaming_ to true.
  std::this_thread::sleep_for(std::chrono::milliseconds(100));

  EXPECT_THROW(model.stream(std::shared_ptr<jsi::Function>(), /*timeout=*/50,
                            /*detectionMargin=*/100),
               RnExecutorchError);

  model.streamStop();
  streamer.join();
}

TEST(VADStreamTests, StreamCanBeRestartedAfterStop) {
  VoiceActivityDetection model(kValidVadModelPath, createMockCallInvoker());

  for (int iter = 0; iter < 2; ++iter) {
    std::thread streamer([&model] {
      model.stream(std::shared_ptr<jsi::Function>(), /*timeout=*/50,
                   /*detectionMargin=*/100);
    });
    std::this_thread::sleep_for(std::chrono::milliseconds(150));
    model.streamStop();
    streamer.join();
  }
}
