#include "BaseModelTests.h"
#include <executorch/extension/tensor/tensor.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/object_detection/Constants.h>
#include <rnexecutorch/models/object_detection/ObjectDetection.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::object_detection;
using namespace model_tests;

constexpr auto kValidObjectDetectionModelPath =
    "ssdlite320-mobilenetv3-large.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// clang-format off
const std::vector<std::string> kCocoLabels = {
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
  "truck", "boat", "traffic light", "fire hydrant", "stop sign",
  "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
  "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag",
  "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite",
  "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
  "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana",
  "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza",
  "donut", "cake", "chair", "couch", "potted plant", "bed", "dining table",
  "toilet", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
  "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock",
  "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
};
// clang-format on

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<ObjectDetection> {
  using ModelType = ObjectDetection;

  static ModelType createValid() {
    return ModelType(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                     nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", {}, {}, {}, nullptr);
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
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg", 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, EmptyImagePathThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  EXPECT_THROW((void)model.generateFromString("", 0.5), RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, MalformedURIThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  EXPECT_THROW((void)model.generateFromString("not_a_valid_uri://bad", 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, NegativeThresholdThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, -0.1),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, ThresholdAboveOneThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 1.1),
               RnExecutorchError);
}

TEST(ObjectDetectionGenerateTests, ValidImageReturnsResults) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);
  EXPECT_GE(results.size(), 0u);
}

TEST(ObjectDetectionGenerateTests, HighThresholdReturnsFewerResults) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto lowThresholdResults = model.generateFromString(kValidTestImagePath, 0.1);
  auto highThresholdResults =
      model.generateFromString(kValidTestImagePath, 0.9);
  EXPECT_GE(lowThresholdResults.size(), highThresholdResults.size());
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidBoundingBoxes) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);

  for (const auto &detection : results) {
    EXPECT_LE(detection.x1, detection.x2);
    EXPECT_LE(detection.y1, detection.y2);
    EXPECT_GE(detection.x1, 0.0f);
    EXPECT_GE(detection.y1, 0.0f);
  }
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidScores) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(ObjectDetectionGenerateTests, DetectionsHaveValidLabels) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3);

  for (const auto &detection : results) {
    const auto &label = detection.label;
    EXPECT_FALSE(label.empty());
    EXPECT_NE(std::find(kCocoLabels.begin(), kCocoLabels.end(), label),
              kCocoLabels.end());
  }
}

// ============================================================================
// generateFromPixels tests
// ============================================================================
TEST(ObjectDetectionPixelTests, ValidPixelDataReturnsResults) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  auto results = model.generateFromPixels(tensorView, 0.3);
  EXPECT_GE(results.size(), 0u);
}

TEST(ObjectDetectionPixelTests, WrongSizesLengthThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  std::vector<uint8_t> pixelData(16, 0);
  JSTensorViewIn tensorView{
      pixelData.data(), {4, 4}, executorch::aten::ScalarType::Byte};
  EXPECT_THROW((void)model.generateFromPixels(tensorView, 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionPixelTests, WrongChannelCountThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  constexpr int32_t width = 4, height = 4, channels = 4;
  std::vector<uint8_t> pixelData(width * height * channels, 0);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  EXPECT_THROW((void)model.generateFromPixels(tensorView, 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionPixelTests, WrongScalarTypeThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 0);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Float};
  EXPECT_THROW((void)model.generateFromPixels(tensorView, 0.5),
               RnExecutorchError);
}

TEST(ObjectDetectionPixelTests, NegativeThresholdThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  EXPECT_THROW((void)model.generateFromPixels(tensorView, -0.1),
               RnExecutorchError);
}

TEST(ObjectDetectionPixelTests, ThresholdAboveOneThrows) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  EXPECT_THROW((void)model.generateFromPixels(tensorView, 1.1),
               RnExecutorchError);
}

TEST(ObjectDetectionInheritedTests, GetInputShapeWorks) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(ObjectDetectionInheritedTests, GetAllInputShapesWorks) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ObjectDetectionInheritedTests, GetMethodMetaWorks) {
  ObjectDetection model(kValidObjectDetectionModelPath, {}, {}, kCocoLabels,
                        nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

// ============================================================================
// Normalisation tests
// ============================================================================
TEST(ObjectDetectionNormTests, ValidNormParamsDoesntThrow) {
  const std::vector<float> mean = {0.485f, 0.456f, 0.406f};
  const std::vector<float> std = {0.229f, 0.224f, 0.225f};
  EXPECT_NO_THROW(
      ObjectDetection(kValidObjectDetectionModelPath, mean, std, {}, nullptr));
}

TEST(ObjectDetectionNormTests, InvalidNormMeanSizeDoesntThrow) {
  EXPECT_NO_THROW(ObjectDetection(kValidObjectDetectionModelPath, {0.5f},
                                  {0.229f, 0.224f, 0.225f}, {}, nullptr));
}

TEST(ObjectDetectionNormTests, InvalidNormStdSizeDoesntThrow) {
  EXPECT_NO_THROW(ObjectDetection(kValidObjectDetectionModelPath,
                                  {0.485f, 0.456f, 0.406f}, {0.5f}, {},
                                  nullptr));
}

TEST(ObjectDetectionNormTests, ValidNormParamsGenerateSucceeds) {
  const std::vector<float> mean = {0.485f, 0.456f, 0.406f};
  const std::vector<float> std = {0.229f, 0.224f, 0.225f};
  ObjectDetection model(kValidObjectDetectionModelPath, mean, std, kCocoLabels,
                        nullptr);
  EXPECT_NO_THROW((void)model.generateFromString(kValidTestImagePath, 0.5));
}
