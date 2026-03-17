#include "BaseModelTests.h"
#include "VisionModelTests.h"
#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/semantic_segmentation/BaseBaseSemanticSegmentation.h>
#include <rnexecutorch/models/semantic_segmentation/Constants.h>
#include <string>
#include <vector>

using namespace rnexecutorch;
using namespace rnexecutorch::models::semantic_segmentation;
using namespace model_tests;
using executorch::extension::make_tensor_ptr;
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

constexpr auto kValidBaseSemanticSegmentationModelPath =
    "deeplabV3_xnnpack_fp32.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<BaseSemanticSegmentation> {
  using ModelType = BaseSemanticSegmentation;

  static ModelType createValid() {
    return ModelType(
        kValidBaseSemanticSegmentationModelPath, {}, {},
        std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                                 constants::kDeeplabV3Resnet50Labels.end()),
        nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", {}, {}, {}, nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generateFromString(kValidTestImagePath, {}, true);
  }
};
} // namespace model_tests

using BaseSemanticSegmentationTypes =
    ::testing::Types<BaseSemanticSegmentation>;
INSTANTIATE_TYPED_TEST_SUITE_P(BaseSemanticSegmentation, CommonModelTest,
                               BaseSemanticSegmentationTypes);
INSTANTIATE_TYPED_TEST_SUITE_P(BaseSemanticSegmentation, VisionModelTest,
                               BaseSemanticSegmentationTypes);

// ============================================================================
// Helper functions
// ============================================================================
static JSTensorViewIn makeRgbView(std::vector<uint8_t> &buf, int32_t h,
                                  int32_t w) {
  buf.assign(static_cast<size_t>(h * w * 3), 128);
  return JSTensorViewIn{
      buf.data(), {h, w, 3}, executorch::aten::ScalarType::Byte};
}

// ============================================================================
// Test fixture for forward() tests
// ============================================================================
class BaseSemanticSegmentationForwardTest : public ::testing::Test {
protected:
  void SetUp() override {
    model = std::make_unique<BaseSemanticSegmentation>(
        kValidBaseSemanticSegmentationModelPath, {}, {},
        std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                                 constants::kDeeplabV3Resnet50Labels.end()),
        nullptr);
    auto shapes = model->getAllInputShapes("forward");
    ASSERT_FALSE(shapes.empty());
    shape = shapes[0];

    size_t numElements = 1;
    for (auto dim : shape) {
      numElements *= dim;
    }
    dummyData = std::vector<float>(numElements, 0.5f);

    sizes = std::vector<int32_t>(shape.begin(), shape.end());
    inputTensor =
        make_tensor_ptr(sizes, dummyData.data(), exec_aten::ScalarType::Float);
  }

  std::unique_ptr<BaseSemanticSegmentation> model;
  std::vector<int32_t> shape;
  std::vector<float> dummyData;
  std::vector<int32_t> sizes;
  TensorPtr inputTensor;
};

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(BaseSemanticSegmentationCtorTests, InvalidPathThrows) {
  EXPECT_THROW(BaseSemanticSegmentation("this_file_does_not_exist.pte", {}, {},
                                        {}, nullptr),
               RnExecutorchError);
}

TEST(BaseSemanticSegmentationCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(BaseSemanticSegmentation(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr));
}

TEST_F(BaseSemanticSegmentationForwardTest, ForwardWithValidTensorSucceeds) {
  auto result = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result.ok());
}

TEST_F(BaseSemanticSegmentationForwardTest, ForwardOutputHasCorrectDimensions) {
  auto result = model->forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.dim(), 4); // NCHW format
}

TEST_F(BaseSemanticSegmentationForwardTest, ForwardOutputHas21Classes) {
  auto result = model->forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.size(1), 21); // DeepLabV3 has 21 classes
}

TEST_F(BaseSemanticSegmentationForwardTest, MultipleForwardsWork) {
  auto result1 = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result1.ok());

  auto result2 = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result2.ok());
}

TEST_F(BaseSemanticSegmentationForwardTest, ForwardAfterUnloadThrows) {
  model->unload();
  EXPECT_THROW((void)model->forward(EValue(inputTensor)), RnExecutorchError);
}

// ============================================================================
// generateFromString tests
// ============================================================================
TEST(BaseSemanticSegmentationGenerateTests, InvalidImagePathThrows) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  EXPECT_THROW(
      (void)model.generateFromString("nonexistent_image.jpg", {}, true),
      RnExecutorchError);
}

TEST(BaseSemanticSegmentationGenerateTests, EmptyImagePathThrows) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  EXPECT_THROW((void)model.generateFromString("", {}, true), RnExecutorchError);
}

TEST(BaseSemanticSegmentationGenerateTests, MalformedURIThrows) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  EXPECT_THROW(
      (void)model.generateFromString("not_a_valid_uri://bad", {}, true),
      RnExecutorchError);
}

TEST(BaseSemanticSegmentationGenerateTests, ValidImageNoFilterReturnsResult) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  auto result = model.generateFromString(kValidTestImagePath, {}, true);
  EXPECT_NE(result.argmax, nullptr);
  EXPECT_NE(result.classBuffers, nullptr);
}

TEST(BaseSemanticSegmentationGenerateTests, ValidImageReturnsAllClasses) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  auto result = model.generateFromString(kValidTestImagePath, {}, true);
  ASSERT_NE(result.classBuffers, nullptr);
  EXPECT_EQ(result.classBuffers->size(), 21u);
}

TEST(BaseSemanticSegmentationGenerateTests, ClassFilterLimitsClassBuffers) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  std::set<std::string, std::less<>> filter = {"PERSON", "CAT"};
  auto result = model.generateFromString(kValidTestImagePath, filter, true);
  ASSERT_NE(result.classBuffers, nullptr);
  // Only the requested classes should appear in classBuffers
  for (const auto &[label, _] : *result.classBuffers) {
    EXPECT_TRUE(filter.count(label) > 0);
  }
}

TEST(BaseSemanticSegmentationGenerateTests, ResizeFalseReturnsResult) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  auto result = model.generateFromString(kValidTestImagePath, {}, false);
  EXPECT_NE(result.argmax, nullptr);
}

// ============================================================================
// generateFromPixels tests
// ============================================================================
TEST(BaseSemanticSegmentationPixelTests, ValidPixelsNoFilterReturnsResult) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, {}, true);
  EXPECT_NE(result.argmax, nullptr);
  EXPECT_NE(result.classBuffers, nullptr);
}

TEST(BaseSemanticSegmentationPixelTests, ValidPixelsReturnsAllClasses) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, {}, true);
  ASSERT_NE(result.classBuffers, nullptr);
  EXPECT_EQ(result.classBuffers->size(), 21u);
}

TEST(BaseSemanticSegmentationPixelTests, ClassFilterLimitsClassBuffers) {
  BaseSemanticSegmentation model(
      kValidBaseSemanticSegmentationModelPath, {}, {},
      std::vector<std::string>(constants::kDeeplabV3Resnet50Labels.begin(),
                               constants::kDeeplabV3Resnet50Labels.end()),
      nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  std::set<std::string, std::less<>> filter = {"PERSON"};
  auto result = model.generateFromPixels(view, filter, true);
  ASSERT_NE(result.classBuffers, nullptr);
  for (const auto &[label, _] : *result.classBuffers) {
    EXPECT_EQ(label, "PERSON");
  }
}

// ============================================================================
// Inherited BaseModel tests
// ============================================================================
TEST(BaseSemanticSegmentationInheritedTests, GetInputShapeWorks) {
  BaseSemanticSegmentation model(kValidBaseSemanticSegmentationModelPath,
                                 nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1); // Batch size
  EXPECT_EQ(shape[1], 3); // RGB channels
}

TEST(BaseSemanticSegmentationInheritedTests, GetAllInputShapesWorks) {
  BaseSemanticSegmentation model(kValidBaseSemanticSegmentationModelPath,
                                 nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(BaseSemanticSegmentationInheritedTests, GetMethodMetaWorks) {
  BaseSemanticSegmentation model(kValidBaseSemanticSegmentationModelPath,
                                 nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(BaseSemanticSegmentationInheritedTests,
     GetMemoryLowerBoundReturnsPositive) {
  BaseSemanticSegmentation model(kValidBaseSemanticSegmentationModelPath,
                                 nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(BaseSemanticSegmentationInheritedTests, InputShapeIsSquare) {
  BaseSemanticSegmentation model(kValidBaseSemanticSegmentationModelPath,
                                 nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape[2], shape[3]); // Height == Width for DeepLabV3
}

// ============================================================================
// Constants tests
// ============================================================================
TEST(BaseSemanticSegmentationConstantsTests, ClassLabelsHas21Entries) {
  EXPECT_EQ(constants::kDeeplabV3Resnet50Labels.size(), 21u);
}

TEST(BaseSemanticSegmentationConstantsTests,
     ClassLabelsContainExpectedClasses) {
  auto &labels = constants::kDeeplabV3Resnet50Labels;
  bool hasBackground = false;
  bool hasPerson = false;
  bool hasCat = false;
  bool hasDog = false;

  for (const auto &label : labels) {
    if (label == "BACKGROUND")
      hasBackground = true;
    if (label == "PERSON")
      hasPerson = true;
    if (label == "CAT")
      hasCat = true;
    if (label == "DOG")
      hasDog = true;
  }

  EXPECT_TRUE(hasBackground);
  EXPECT_TRUE(hasPerson);
  EXPECT_TRUE(hasCat);
  EXPECT_TRUE(hasDog);
}
