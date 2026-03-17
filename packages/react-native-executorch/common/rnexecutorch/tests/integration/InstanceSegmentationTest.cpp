#include "BaseModelTests.h"
#include "VisionModelTests.h"
#include <executorch/extension/tensor/tensor.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/instance_segmentation/BaseInstanceSegmentation.h>
#include <rnexecutorch/models/instance_segmentation/Types.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::instance_segmentation;
using namespace model_tests;

constexpr auto kValidInstanceSegModelPath = "yolo26n-seg.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/segmentation_image.jpg";
constexpr auto kMethodName = "forward_384";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<BaseInstanceSegmentation> {
  using ModelType = BaseInstanceSegmentation;

  static ModelType createValid() {
    return ModelType(kValidInstanceSegModelPath, {}, {}, true, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", {}, {}, true, nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generateFromString(kValidTestImagePath, 0.5, 0.5, 100, {}, true,
                                   kMethodName);
  }
};
} // namespace model_tests

using InstanceSegmentationTypes = ::testing::Types<BaseInstanceSegmentation>;
INSTANTIATE_TYPED_TEST_SUITE_P(InstanceSegmentation, CommonModelTest,
                               InstanceSegmentationTypes);
INSTANTIATE_TYPED_TEST_SUITE_P(InstanceSegmentation, VisionModelTest,
                               InstanceSegmentationTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(InstanceSegGenerateTests, InvalidImagePathThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg", 0.5, 0.5,
                                              100, {}, true, kMethodName),
               RnExecutorchError);
}

TEST(InstanceSegGenerateTests, EmptyImagePathThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  EXPECT_THROW(
      (void)model.generateFromString("", 0.5, 0.5, 100, {}, true, kMethodName),
      RnExecutorchError);
}

TEST(InstanceSegGenerateTests, EmptyMethodNameThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, 0.5,
                                              100, {}, true, ""),
               RnExecutorchError);
}

TEST(InstanceSegGenerateTests, NegativeConfidenceThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, -0.1, 0.5,
                                              100, {}, true, kMethodName),
               RnExecutorchError);
}

TEST(InstanceSegGenerateTests, ConfidenceAboveOneThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 1.1, 0.5,
                                              100, {}, true, kMethodName),
               RnExecutorchError);
}

TEST(InstanceSegGenerateTests, NegativeIouThresholdThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, -0.1,
                                              100, {}, true, kMethodName),
               RnExecutorchError);
}

TEST(InstanceSegGenerateTests, IouThresholdAboveOneThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  EXPECT_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, 1.1,
                                              100, {}, true, kMethodName),
               RnExecutorchError);
}

TEST(InstanceSegGenerateTests, ValidImageReturnsResults) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                          {}, true, kMethodName);
  EXPECT_FALSE(results.empty());
}

TEST(InstanceSegGenerateTests, HighThresholdReturnsFewerResults) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto lowResults = model.generateFromString(kValidTestImagePath, 0.1, 0.5, 100,
                                             {}, true, kMethodName);
  auto highResults = model.generateFromString(kValidTestImagePath, 0.9, 0.5,
                                              100, {}, true, kMethodName);
  EXPECT_GE(lowResults.size(), highResults.size());
}

TEST(InstanceSegGenerateTests, MaxInstancesLimitsResults) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.1, 0.5, 2, {},
                                          true, kMethodName);
  EXPECT_LE(results.size(), 2u);
}

// ============================================================================
// Result validation tests
// ============================================================================
TEST(InstanceSegResultTests, InstancesHaveValidBoundingBoxes) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                          {}, true, kMethodName);

  for (const auto &inst : results) {
    EXPECT_LE(inst.bbox.x1, inst.bbox.x2);
    EXPECT_LE(inst.bbox.y1, inst.bbox.y2);
    EXPECT_GE(inst.bbox.x1, 0.0f);
    EXPECT_GE(inst.bbox.y1, 0.0f);
  }
}

TEST(InstanceSegResultTests, InstancesHaveValidScores) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                          {}, true, kMethodName);

  for (const auto &inst : results) {
    EXPECT_GE(inst.score, 0.0f);
    EXPECT_LE(inst.score, 1.0f);
  }
}

TEST(InstanceSegResultTests, InstancesHaveValidMasks) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                          {}, true, kMethodName);

  for (const auto &inst : results) {
    EXPECT_GT(inst.maskWidth, 0);
    EXPECT_GT(inst.maskHeight, 0);
    EXPECT_EQ(inst.mask->size(),
              static_cast<size_t>(inst.maskWidth) * inst.maskHeight);

    for (size_t i = 0; i < inst.mask->size(); ++i) {
      uint8_t val = inst.mask->data()[i];
      EXPECT_TRUE(val == 0 || val == 1);
    }
  }
}

TEST(InstanceSegResultTests, InstancesHaveValidClassIndices) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto results = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                          {}, true, kMethodName);

  for (const auto &inst : results) {
    EXPECT_GE(inst.classIndex, 0);
    EXPECT_LT(inst.classIndex, 80); // COCO YOLO has 80 classes
  }
}

// ============================================================================
// Class filtering tests
// ============================================================================
TEST(InstanceSegFilterTests, ClassFilterReturnsOnlyMatchingClasses) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  // Filter to class index 0 (PERSON in CocoLabelYolo)
  std::vector<int32_t> classIndices = {0};
  auto results = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                          classIndices, true, kMethodName);

  for (const auto &inst : results) {
    EXPECT_EQ(inst.classIndex, 0);
  }
}

TEST(InstanceSegFilterTests, EmptyFilterReturnsAllClasses) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto allResults = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                             {}, true, kMethodName);
  EXPECT_FALSE(allResults.empty());

  auto noResults = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100,
                                            {50}, true, kMethodName);
  EXPECT_TRUE(noResults.empty());
}

// ============================================================================
// Mask resolution tests
// ============================================================================
TEST(InstanceSegMaskTests, LowResMaskIsSmallerThanOriginal) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto hiRes = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100, {},
                                        true, kMethodName);
  auto loRes = model.generateFromString(kValidTestImagePath, 0.3, 0.5, 100, {},
                                        false, kMethodName);

  if (!hiRes.empty() && !loRes.empty()) {
    EXPECT_LE(loRes[0].mask->size(), hiRes[0].mask->size());
  }
}

// ============================================================================
// NMS tests
// ============================================================================
TEST(InstanceSegNMSTests, NMSEnabledReturnsFewerOrEqualResults) {
  BaseInstanceSegmentation modelWithNMS(kValidInstanceSegModelPath, {}, {},
                                        true, nullptr);
  BaseInstanceSegmentation modelWithoutNMS(kValidInstanceSegModelPath, {}, {},
                                           false, nullptr);

  auto nmsResults = modelWithNMS.generateFromString(
      kValidTestImagePath, 0.3, 0.5, 100, {}, true, kMethodName);
  auto noNmsResults = modelWithoutNMS.generateFromString(
      kValidTestImagePath, 0.3, 0.5, 100, {}, true, kMethodName);

  EXPECT_LE(nmsResults.size(), noNmsResults.size());
}

// ============================================================================
// generateFromPixels tests
// ============================================================================
TEST(InstanceSegPixelTests, ValidPixelDataReturnsResults) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  auto results = model.generateFromPixels(tensorView, 0.3, 0.5, 100, {}, true,
                                          kMethodName);
  EXPECT_GE(results.size(), 0u);
}

TEST(InstanceSegPixelTests, NegativeConfidenceThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  EXPECT_THROW((void)model.generateFromPixels(tensorView, -0.1, 0.5, 100, {},
                                              true, kMethodName),
               RnExecutorchError);
}

TEST(InstanceSegPixelTests, ConfidenceAboveOneThrows) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  constexpr int32_t width = 4, height = 4, channels = 3;
  std::vector<uint8_t> pixelData(width * height * channels, 128);
  JSTensorViewIn tensorView{pixelData.data(),
                            {height, width, channels},
                            executorch::aten::ScalarType::Byte};
  EXPECT_THROW((void)model.generateFromPixels(tensorView, 1.1, 0.5, 100, {},
                                              true, kMethodName),
               RnExecutorchError);
}

// ============================================================================
// Inherited method tests
// ============================================================================
TEST(InstanceSegInheritedTests, GetInputShapeWorks) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto shape = model.getInputShape(kMethodName, 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(InstanceSegInheritedTests, GetAllInputShapesWorks) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto shapes = model.getAllInputShapes(kMethodName);
  EXPECT_FALSE(shapes.empty());
}

TEST(InstanceSegInheritedTests, GetMethodMetaWorks) {
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, {}, {}, true,
                                 nullptr);
  auto result = model.getMethodMeta(kMethodName);
  EXPECT_TRUE(result.ok());
}

// ============================================================================
// Normalisation tests
// ============================================================================
TEST(InstanceSegNormTests, ValidNormParamsDoesntThrow) {
  const std::vector<float> mean = {0.485f, 0.456f, 0.406f};
  const std::vector<float> std = {0.229f, 0.224f, 0.225f};
  EXPECT_NO_THROW(BaseInstanceSegmentation(kValidInstanceSegModelPath, mean,
                                           std, true, nullptr));
}

TEST(InstanceSegNormTests, ValidNormParamsGenerateSucceeds) {
  const std::vector<float> mean = {0.485f, 0.456f, 0.406f};
  const std::vector<float> std = {0.229f, 0.224f, 0.225f};
  BaseInstanceSegmentation model(kValidInstanceSegModelPath, mean, std, true,
                                 nullptr);
  EXPECT_NO_THROW((void)model.generateFromString(kValidTestImagePath, 0.5, 0.5,
                                                 100, {}, true, kMethodName));
}
