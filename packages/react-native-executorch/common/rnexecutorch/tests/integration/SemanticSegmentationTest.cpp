#include <algorithm>
#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/semantic_segmentation/BaseSemanticSegmentation.h>
#include <string>
#include <vector>

using namespace rnexecutorch;
using namespace rnexecutorch::models::semantic_segmentation;
using executorch::extension::make_tensor_ptr;
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

constexpr auto kValidSemanticSegmentationModelPath =
    "deeplabV3_xnnpack_fp32.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// DeepLab V3 class labels (Pascal VOC)
static const std::vector<std::string> kDeeplabV3Labels = {
    "BACKGROUND", "AEROPLANE",   "BICYCLE", "BIRD",  "BOAT",
    "BOTTLE",     "BUS",         "CAR",     "CAT",   "CHAIR",
    "COW",        "DININGTABLE", "DOG",     "HORSE", "MOTORBIKE",
    "PERSON",     "POTTEDPLANT", "SHEEP",   "SOFA",  "TRAIN",
    "TVMONITOR"};

// ImageNet normalization constants
static const std::vector<float> kImageNetMean = {0.485f, 0.456f, 0.406f};
static const std::vector<float> kImageNetStd = {0.229f, 0.224f, 0.225f};

static JSTensorViewIn makeRgbView(std::vector<uint8_t> &buf, int32_t h,
                                  int32_t w) {
  buf.assign(static_cast<size_t>(h * w * 3), 128);
  return JSTensorViewIn{
      buf.data(), {h, w, 3}, executorch::aten::ScalarType::Byte};
}

// Test fixture for tests that need dummy input data
class SemanticSegmentationForwardTest : public ::testing::Test {
protected:
  void SetUp() override {
    model = std::make_unique<BaseSemanticSegmentation>(
        kValidSemanticSegmentationModelPath, kImageNetMean, kImageNetStd,
        kDeeplabV3Labels, nullptr);
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

TEST(SemanticSegmentationCtorTests, InvalidPathThrows) {
  EXPECT_THROW(BaseSemanticSegmentation("this_file_does_not_exist.pte",
                                        kImageNetMean, kImageNetStd,
                                        kDeeplabV3Labels, nullptr),
               RnExecutorchError);
}

TEST(SemanticSegmentationCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(BaseSemanticSegmentation(kValidSemanticSegmentationModelPath,
                                           kImageNetMean, kImageNetStd,
                                           kDeeplabV3Labels, nullptr));
}

TEST_F(SemanticSegmentationForwardTest, ForwardWithValidTensorSucceeds) {
  auto result = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result.ok());
}

TEST_F(SemanticSegmentationForwardTest, ForwardOutputHasCorrectDimensions) {
  auto result = model->forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.dim(), 4); // NCHW format
}

TEST_F(SemanticSegmentationForwardTest, ForwardOutputHas21Classes) {
  auto result = model->forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.size(1), 21); // DeepLabV3 has 21 classes
}

TEST_F(SemanticSegmentationForwardTest, MultipleForwardsWork) {
  auto result1 = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result1.ok());

  auto result2 = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result2.ok());
}

TEST_F(SemanticSegmentationForwardTest, ForwardAfterUnloadThrows) {
  model->unload();
  EXPECT_THROW((void)model->forward(EValue(inputTensor)), RnExecutorchError);
}

// ============================================================================
// generateFromString tests
// ============================================================================
TEST(SemanticSegmentationGenerateTests, InvalidImagePathThrows) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  EXPECT_THROW(
      (void)model.generateFromString("nonexistent_image.jpg", {}, true),
      RnExecutorchError);
}

TEST(SemanticSegmentationGenerateTests, EmptyImagePathThrows) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  EXPECT_THROW((void)model.generateFromString("", {}, true), RnExecutorchError);
}

TEST(SemanticSegmentationGenerateTests, MalformedURIThrows) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  EXPECT_THROW(
      (void)model.generateFromString("not_a_valid_uri://bad", {}, true),
      RnExecutorchError);
}

TEST(SemanticSegmentationGenerateTests, ValidImageNoFilterReturnsResult) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  auto result = model.generateFromString(kValidTestImagePath, {}, true);
  EXPECT_NE(result.argmax, nullptr);
  EXPECT_NE(result.classBuffers, nullptr);
}

TEST(SemanticSegmentationGenerateTests, ValidImageReturnsAllClasses) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  auto result = model.generateFromString(kValidTestImagePath, {}, true);
  ASSERT_NE(result.classBuffers, nullptr);
  EXPECT_EQ(result.classBuffers->size(), 21u);
}

TEST(SemanticSegmentationGenerateTests, ClassFilterLimitsClassBuffers) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  std::set<std::string, std::less<>> filter = {"PERSON", "CAT"};
  auto result = model.generateFromString(kValidTestImagePath, filter, true);
  ASSERT_NE(result.classBuffers, nullptr);
  // Only the requested classes should appear in classBuffers
  for (const auto &[label, _] : *result.classBuffers) {
    EXPECT_TRUE(filter.count(label) > 0);
  }
}

TEST(SemanticSegmentationGenerateTests, ResizeFalseReturnsResult) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  auto result = model.generateFromString(kValidTestImagePath, {}, false);
  EXPECT_NE(result.argmax, nullptr);
}

// ============================================================================
// generateFromPixels tests
// ============================================================================
TEST(SemanticSegmentationPixelTests, ValidPixelsNoFilterReturnsResult) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, {}, true);
  EXPECT_NE(result.argmax, nullptr);
  EXPECT_NE(result.classBuffers, nullptr);
}

TEST(SemanticSegmentationPixelTests, ValidPixelsReturnsAllClasses) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, {}, true);
  ASSERT_NE(result.classBuffers, nullptr);
  EXPECT_EQ(result.classBuffers->size(), 21u);
}

TEST(SemanticSegmentationPixelTests, ClassFilterLimitsClassBuffers) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
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
TEST(SemanticSegmentationInheritedTests, GetInputShapeWorks) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1); // Batch size
  EXPECT_EQ(shape[1], 3); // RGB channels
}

TEST(SemanticSegmentationInheritedTests, GetAllInputShapesWorks) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(SemanticSegmentationInheritedTests, GetMethodMetaWorks) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(SemanticSegmentationInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(SemanticSegmentationInheritedTests, InputShapeIsSquare) {
  BaseSemanticSegmentation model(kValidSemanticSegmentationModelPath,
                                 kImageNetMean, kImageNetStd, kDeeplabV3Labels,
                                 nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape[2], shape[3]); // Height == Width for DeepLabV3
}

// ============================================================================
// Constants tests
// ============================================================================
TEST(SemanticSegmentationConstantsTests, ClassLabelsHas21Entries) {
  EXPECT_EQ(kDeeplabV3Labels.size(), 21u);
}

TEST(SemanticSegmentationConstantsTests, ClassLabelsContainExpectedClasses) {
  const auto &labels = kDeeplabV3Labels;

  auto contains = [&labels](const std::string &target) {
    return std::ranges::find(labels, target) != labels.end();
  };

  EXPECT_TRUE(contains("BACKGROUND"));
  EXPECT_TRUE(contains("PERSON"));
  EXPECT_TRUE(contains("CAT"));
  EXPECT_TRUE(contains("DOG"));
}
