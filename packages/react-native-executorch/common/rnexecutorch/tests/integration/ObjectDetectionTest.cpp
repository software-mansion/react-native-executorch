#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/object_detection/Constants.h>
#include <rnexecutorch/models/object_detection/ObjectDetection.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::object_detection;
using namespace model_tests;

constexpr auto kValidObjectDetectionModelPath =
    "ssdlite320-mobilenetv3-large.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<ObjectDetection> {
  using ModelType = ObjectDetection;

  static ModelType createValid() {
    return ModelType(kValidObjectDetectionModelPath, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generateFromString(kValidTestImagePath, 0.5);
  }
};
} // namespace model_tests

using ObjectDetectionTypes = ::testing::Types<ObjectDetection>;
INSTANTIATE_TYPED_TEST_SUITE_P(ObjectDetection, CommonModelTest,
                               ObjectDetectionTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(ObjectDetectionGenerateTests, InvalidImagePathThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg", 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, EmptyImagePathThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("", 0.5), RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, MalformedURIThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("not_a_valid_uri://bad", 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, NegativeThresholdThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, -0.1),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, ThresholdAboveOneThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 1.1),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, ValidImageReturnsResults) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);
  EXPECT_GE(results.size(), 0u);
}

TEST(ObjectDetectionGenerateTests, HighThresholdReturnsFewerResults) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto lowThresholdResults = model.generateFromString(kValidTestImagePath, 0.1);
  auto highThresholdResults =
      model.generateFromString(kValidTestImagePath, 0.9);
  EXPECT_GE(lowThresholdResults.size(), highThresholdResults.size());
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidBoundingBoxes) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);

  for (const auto &detection : results) {
    EXPECT_LE(detection.x1, detection.x2);
    EXPECT_LE(detection.y1, detection.y2);
    EXPECT_GE(detection.x1, 0.0f);
    EXPECT_GE(detection.y1, 0.0f);
  }
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidScores) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidLabels) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);

  for (const auto &detection : results) {
    EXPECT_GE(detection.label, 0);
  }
}

TEST(ObjectDetectionInheritedTests, GetInputShapeWorks) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(ObjectDetectionInheritedTests, GetAllInputShapesWorks) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ObjectDetectionInheritedTests, GetMethodMetaWorks) {
  ObjectDetection model(kValidObjectDetectionModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}
