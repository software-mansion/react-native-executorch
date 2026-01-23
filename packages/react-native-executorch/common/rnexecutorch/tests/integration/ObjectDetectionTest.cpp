#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/object_detection/Constants.h>
#include <rnexecutorch/models/object_detection/ObjectDetection.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::object_detection;
using namespace model_tests;

constexpr auto VALID_OBJECT_DETECTION_MODEL_PATH =
    "ssdlite320-mobilenetv3-large.pte";
constexpr auto VALID_TEST_IMAGE_PATH =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<ObjectDetection> {
  using ModelType = ObjectDetection;

  static ModelType createValid() {
    return ModelType(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate(VALID_TEST_IMAGE_PATH, 0.5);
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
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg", 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, ValidImageReturnsResults) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH, 0.3);
  EXPECT_GE(results.size(), 0u);
}

TEST(ObjectDetectionGenerateTests, HighThresholdReturnsFewerResults) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto lowThresholdResults = model.generate(VALID_TEST_IMAGE_PATH, 0.1);
  auto highThresholdResults = model.generate(VALID_TEST_IMAGE_PATH, 0.9);
  EXPECT_GE(lowThresholdResults.size(), highThresholdResults.size());
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidBoundingBoxes) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH, 0.3);

  for (const auto &detection : results) {
    EXPECT_LE(detection.x1, detection.x2);
    EXPECT_LE(detection.y1, detection.y2);
    EXPECT_GE(detection.x1, 0.0f);
    EXPECT_GE(detection.y1, 0.0f);
  }
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidScores) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH, 0.3);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidLabels) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH, 0.3);

  for (const auto &detection : results) {
    EXPECT_GE(detection.label, 0);
  }
}

TEST(ObjectDetectionInheritedTests, GetInputShapeWorks) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(ObjectDetectionInheritedTests, GetAllInputShapesWorks) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ObjectDetectionInheritedTests, GetMethodMetaWorks) {
  ObjectDetection model(VALID_OBJECT_DETECTION_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}
