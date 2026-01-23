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

constexpr auto VALID_IMAGE_SEGMENTATION_MODEL_PATH =
    "deeplabV3_xnnpack_fp32.pte";

TEST(ImageSegmentationCtorTests, InvalidPathThrows) {
  EXPECT_THROW(ImageSegmentation("this_file_does_not_exist.pte", nullptr),
               RnExecutorchError);
}

TEST(ImageSegmentationCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(
      ImageSegmentation(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr));
}

TEST(ImageSegmentationForwardTests, ForwardWithValidTensorSucceeds) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  ASSERT_FALSE(shapes.empty());
  auto &shape = shapes[0];

  size_t numElements = 1;
  for (auto dim : shape) {
    numElements *= dim;
  }
  std::vector<float> dummyData(numElements, 0.5f);

  std::vector<int32_t> sizes(shape.begin(), shape.end());
  TensorPtr inputTensor =
      make_tensor_ptr(sizes, dummyData.data(), exec_aten::ScalarType::Float);

  auto result = model.forward(EValue(inputTensor));
  EXPECT_TRUE(result.ok());
}

TEST(ImageSegmentationForwardTests, ForwardOutputHasCorrectDimensions) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  ASSERT_FALSE(shapes.empty());
  auto &shape = shapes[0];

  size_t numElements = 1;
  for (auto dim : shape) {
    numElements *= dim;
  }
  std::vector<float> dummyData(numElements, 0.5f);

  std::vector<int32_t> sizes(shape.begin(), shape.end());
  TensorPtr inputTensor =
      make_tensor_ptr(sizes, dummyData.data(), exec_aten::ScalarType::Float);

  auto result = model.forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.dim(), 4); // NCHW format
}

TEST(ImageSegmentationForwardTests, ForwardOutputHas21Classes) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  ASSERT_FALSE(shapes.empty());
  auto &shape = shapes[0];

  size_t numElements = 1;
  for (auto dim : shape) {
    numElements *= dim;
  }
  std::vector<float> dummyData(numElements, 0.5f);

  std::vector<int32_t> sizes(shape.begin(), shape.end());
  TensorPtr inputTensor =
      make_tensor_ptr(sizes, dummyData.data(), exec_aten::ScalarType::Float);

  auto result = model.forward(EValue(inputTensor));
  ASSERT_TRUE(result.ok());

  auto &outputs = result.get();
  ASSERT_FALSE(outputs.empty());

  auto outputTensor = outputs[0].toTensor();
  EXPECT_EQ(outputTensor.size(1), 21); // DeepLabV3 has 21 classes
}

TEST(ImageSegmentationForwardTests, MultipleForwardsWork) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  ASSERT_FALSE(shapes.empty());
  auto &shape = shapes[0];

  size_t numElements = 1;
  for (auto dim : shape) {
    numElements *= dim;
  }
  std::vector<float> dummyData(numElements, 0.5f);

  std::vector<int32_t> sizes(shape.begin(), shape.end());
  TensorPtr inputTensor =
      make_tensor_ptr(sizes, dummyData.data(), exec_aten::ScalarType::Float);

  auto result1 = model.forward(EValue(inputTensor));
  EXPECT_TRUE(result1.ok());

  auto result2 = model.forward(EValue(inputTensor));
  EXPECT_TRUE(result2.ok());
}

TEST(ImageSegmentationUnloadTests, ForwardAfterUnloadThrows) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  ASSERT_FALSE(shapes.empty());
  auto &shape = shapes[0];

  size_t numElements = 1;
  for (auto dim : shape) {
    numElements *= dim;
  }
  std::vector<float> dummyData(numElements, 0.5f);

  std::vector<int32_t> sizes(shape.begin(), shape.end());
  TensorPtr inputTensor =
      make_tensor_ptr(sizes, dummyData.data(), exec_aten::ScalarType::Float);

  model.unload();
  EXPECT_THROW((void)model.forward(EValue(inputTensor)), RnExecutorchError);
}

TEST(ImageSegmentationInheritedTests, GetInputShapeWorks) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1); // Batch size
  EXPECT_EQ(shape[1], 3); // RGB channels
}

TEST(ImageSegmentationInheritedTests, GetAllInputShapesWorks) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ImageSegmentationInheritedTests, GetMethodMetaWorks) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(ImageSegmentationInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(ImageSegmentationInheritedTests, InputShapeIsSquare) {
  ImageSegmentation model(VALID_IMAGE_SEGMENTATION_MODEL_PATH, nullptr);
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
