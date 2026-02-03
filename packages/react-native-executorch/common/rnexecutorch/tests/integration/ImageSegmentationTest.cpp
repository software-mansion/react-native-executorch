#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/image_segmentation/Constants.h>
#include <rnexecutorch/models/image_segmentation/ImageSegmentation.h>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::image_segmentation;
using executorch::extension::make_tensor_ptr;
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

constexpr auto kValidImageSegmentationModelPath = "deeplabV3_xnnpack_fp32.pte";

// Test fixture for tests that need dummy input data
class ImageSegmentationForwardTest : public ::testing::Test {
protected:
  void SetUp() override {
    model = std::make_unique<ImageSegmentation>(
        kValidImageSegmentationModelPath, nullptr);
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

  std::unique_ptr<ImageSegmentation> model;
  std::vector<int32_t> shape;
  std::vector<float> dummyData;
  std::vector<int32_t> sizes;
  TensorPtr inputTensor;
};

TEST(ImageSegmentationCtorTests, InvalidPathThrows) {
  EXPECT_THROW(ImageSegmentation("this_file_does_not_exist.pte", nullptr),
               RnExecutorchError);
}

TEST(ImageSegmentationCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(ImageSegmentation(kValidImageSegmentationModelPath, nullptr));
}

TEST_F(ImageSegmentationForwardTest, ForwardWithValidTensorSucceeds) {
  auto result = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result.ok());
}

TEST_F(ImageSegmentationForwardTest, ForwardOutputHasCorrectDimensions) {
  auto result = model->forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.dim(), 4); // NCHW format
}

TEST_F(ImageSegmentationForwardTest, ForwardOutputHas21Classes) {
  auto result = model->forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.size(1), 21); // DeepLabV3 has 21 classes
}

TEST_F(ImageSegmentationForwardTest, MultipleForwardsWork) {
  auto result1 = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result1.ok());

  auto result2 = model->forward(EValue(inputTensor));
  EXPECT_TRUE(result2.ok());
}

TEST_F(ImageSegmentationForwardTest, ForwardAfterUnloadThrows) {
  model->unload();
  EXPECT_THROW((void)model->forward(EValue(inputTensor)), RnExecutorchError);
}

TEST(ImageSegmentationInheritedTests, GetInputShapeWorks) {
  ImageSegmentation model(kValidImageSegmentationModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1); // Batch size
  EXPECT_EQ(shape[1], 3); // RGB channels
}

TEST(ImageSegmentationInheritedTests, GetAllInputShapesWorks) {
  ImageSegmentation model(kValidImageSegmentationModelPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ImageSegmentationInheritedTests, GetMethodMetaWorks) {
  ImageSegmentation model(kValidImageSegmentationModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(ImageSegmentationInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  ImageSegmentation model(kValidImageSegmentationModelPath, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(ImageSegmentationInheritedTests, InputShapeIsSquare) {
  ImageSegmentation model(kValidImageSegmentationModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape[2], shape[3]); // Height == Width for DeepLabV3
}

TEST(ImageSegmentationConstantsTests, ClassLabelsHas21Entries) {
  EXPECT_EQ(constants::kDeeplabV3Resnet50Labels.size(), 21u);
}

TEST(ImageSegmentationConstantsTests, ClassLabelsContainExpectedClasses) {
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
