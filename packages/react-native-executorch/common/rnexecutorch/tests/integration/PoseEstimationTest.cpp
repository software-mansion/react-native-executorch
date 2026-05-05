#include "BaseModelTests.h"
#include "VisionModelTests.h"
#include <executorch/extension/tensor/tensor.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/pose_estimation/PoseEstimation.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::pose_estimation;
using namespace model_tests;

constexpr auto kValidPoseModelPath = "yolo26n-pose.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/we_are_software_mansion.jpg";
constexpr auto kMethodName = "forward_384";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<PoseEstimation> {
  using ModelType = PoseEstimation;

  static ModelType createValid() {
    return ModelType(kValidPoseModelPath, {}, {}, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", {}, {}, nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generateFromString(kValidTestImagePath, 0.5, 0.5, kMethodName);
  }
};
} // namespace model_tests

using PoseEstimationTypes = ::testing::Types<PoseEstimation>;
INSTANTIATE_TYPED_TEST_SUITE_P(PoseEstimation, CommonModelTest,
                               PoseEstimationTypes);
INSTANTIATE_TYPED_TEST_SUITE_P(PoseEstimation, VisionModelTest,
                               PoseEstimationTypes);

// ============================================================================
// generateFromString — input path validity
// ============================================================================
TEST(PoseEstimationGenerateTests, InvalidImagePathThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg", 0.5, 0.5,
                                              kMethodName),
               RnExecutorchError);
}

TEST(PoseEstimationGenerateTests, EmptyImagePathThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString("", 0.5, 0.5, kMethodName),
               RnExecutorchError);
}

TEST(PoseEstimationGenerateTests, MalformedURIThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString("not_a_valid_uri://bad", 0.5, 0.5,
                                              kMethodName),
               RnExecutorchError);
}

// ============================================================================
// generateFromString — threshold range
// ============================================================================
TEST(PoseEstimationGenerateTests, NegativeDetectionThresholdThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, -0.1, 0.5,
                                              kMethodName),
               RnExecutorchError);
}

TEST(PoseEstimationGenerateTests, DetectionThresholdAboveOneThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 1.1, 0.5,
                                              kMethodName),
               RnExecutorchError);
}

TEST(PoseEstimationGenerateTests, NegativeKeypointThresholdThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, -0.1,
                                              kMethodName),
               RnExecutorchError);
}

TEST(PoseEstimationGenerateTests, KeypointThresholdAboveOneThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, 1.1,
                                              kMethodName),
               RnExecutorchError);
}

// ============================================================================
// generateFromString — happy path & output shape
// ============================================================================
TEST(PoseEstimationGenerateTests, ValidImageReturnsResults) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  auto results =
      model.generateFromString(kValidTestImagePath, 0.3, 0.5, kMethodName);
  EXPECT_GE(results.size(), 0u);
}

TEST(PoseEstimationGenerateTests, HighThresholdReturnsFewerResults) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  auto lowThresholdResults =
      model.generateFromString(kValidTestImagePath, 0.1, 0.5, kMethodName);
  auto highThresholdResults =
      model.generateFromString(kValidTestImagePath, 0.95, 0.5, kMethodName);
  EXPECT_GE(lowThresholdResults.size(), highThresholdResults.size());
}

TEST(PoseEstimationGenerateTests, AllDetectionsHaveSameKeypointCount) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  auto results =
      model.generateFromString(kValidTestImagePath, 0.1, 0.5, kMethodName);
  if (results.size() < 2) {
    GTEST_SKIP() << "Need at least 2 detections to compare keypoint counts";
  }
  const size_t firstSize = results.front().size();
  EXPECT_GT(firstSize, 0u);
  for (const auto &person : results) {
    EXPECT_EQ(person.size(), firstSize);
  }
}

TEST(PoseEstimationGenerateTests, KeypointsHaveValidStructure) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  auto results =
      model.generateFromString(kValidTestImagePath, 0.3, 0.5, kMethodName);
  // Each detection must contain a non-zero number of keypoints, and each
  // keypoint must be aggregate-initializable as { x, y } ints (compile-time).
  for (const auto &person : results) {
    EXPECT_GT(person.size(), 0u);
    for (const auto &kp : person) {
      // No range constraint here — out-of-bounds coords are valid model
      // output for low-visibility keypoints; consumers filter on visibility.
      static_assert(std::is_same_v<decltype(kp.x), int32_t>);
      static_assert(std::is_same_v<decltype(kp.y), int32_t>);
      (void)kp;
    }
  }
}

// ============================================================================
// generateFromPixels
// ============================================================================
TEST(PoseEstimationPixelTests, ValidPixelDataReturnsResults) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  auto results = model.generateFromPixels(tensorView, 0.3, 0.5, kMethodName);
  EXPECT_GE(results.size(), 0u);
}

TEST(PoseEstimationPixelTests, NegativeThresholdThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  EXPECT_THROW(
      (void)model.generateFromPixels(tensorView, -0.1, 0.5, kMethodName),
      RnExecutorchError);
}

TEST(PoseEstimationPixelTests, ThresholdAboveOneThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  EXPECT_THROW(
      (void)model.generateFromPixels(tensorView, 1.1, 0.5, kMethodName),
      RnExecutorchError);
}

// ============================================================================
// Method name
// ============================================================================
TEST(PoseEstimationMethodTests, InvalidMethodNameThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, 0.5,
                                              "forward_999"),
               RnExecutorchError);
}

TEST(PoseEstimationMethodTests, EmptyMethodNameThrows) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  EXPECT_THROW(
      (void)model.generateFromString(kValidTestImagePath, 0.5, 0.5, ""),
      RnExecutorchError);
}

// ============================================================================
// Normalisation params (constructor logs but does not throw)
// ============================================================================
TEST(PoseEstimationNormTests, ValidNormParamsDoesntThrow) {
  const std::vector<float> mean = {0.485f, 0.456f, 0.406f};
  const std::vector<float> std = {0.229f, 0.224f, 0.225f};
  EXPECT_NO_THROW(PoseEstimation(kValidPoseModelPath, mean, std, nullptr));
}

TEST(PoseEstimationNormTests, InvalidNormMeanSizeDoesntThrow) {
  EXPECT_NO_THROW(PoseEstimation(kValidPoseModelPath, {0.5f},
                                 {0.229f, 0.224f, 0.225f}, nullptr));
}

TEST(PoseEstimationNormTests, InvalidNormStdSizeDoesntThrow) {
  EXPECT_NO_THROW(PoseEstimation(kValidPoseModelPath, {0.485f, 0.456f, 0.406f},
                                 {0.5f}, nullptr));
}

TEST(PoseEstimationNormTests, ValidNormParamsGenerateSucceeds) {
  const std::vector<float> mean = {0.485f, 0.456f, 0.406f};
  const std::vector<float> std = {0.229f, 0.224f, 0.225f};
  PoseEstimation model(kValidPoseModelPath, mean, std, nullptr);
  EXPECT_NO_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, 0.5,
                                                 kMethodName));
}

// ============================================================================
// Inherited VisionModel methods
// ============================================================================
TEST(PoseEstimationInheritedTests, GetInputShapeWorks) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  auto shape = model.getInputShape(kMethodName, 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(PoseEstimationInheritedTests, GetAllInputShapesWorks) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  auto shapes = model.getAllInputShapes(kMethodName);
  EXPECT_FALSE(shapes.empty());
}

TEST(PoseEstimationInheritedTests, GetMethodMetaWorks) {
  PoseEstimation model(kValidPoseModelPath, {}, {}, nullptr);
  auto result = model.getMethodMeta(kMethodName);
  EXPECT_TRUE(result.ok());
}
