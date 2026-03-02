#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/semantic_segmentation/Constants.h>
#include <rnexecutorch/models/semantic_segmentation/SemanticSegmentation.h>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::semantic_segmentation;
using executorch::extension::make_tensor_ptr;
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

constexpr auto kValidSemanticSegmentationModelPath =
    "deeplabV3_xnnpack_fp32.pte";

// Test fixture for tests that need dummy input data
class SemanticSegmentationForwardTest : public ::testing::Test {
protected:
  void SetUp() override {
    model = std::make_unique<SemanticSegmentation>(
        kValidSemanticSegmentationModelPath, nullptr);
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

  std::unique_ptr<SemanticSegmentation> model;
  std::vector<int32_t> shape;
  std::vector<float> dummyData;
  std::vector<int32_t> sizes;
  TensorPtr inputTensor;
};

TEST(SemanticSegmentationCtorTests, InvalidPathThrows) {
  EXPECT_THROW(SemanticSegmentation("this_file_does_not_exist.pte", nullptr),
               RnExecutorchError);
}

TEST(SemanticSegmentationCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(
      SemanticSegmentation(kValidSemanticSegmentationModelPath, nullptr));
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

TEST(SemanticSegmentationInheritedTests, GetInputShapeWorks) {
  SemanticSegmentation model(kValidSemanticSegmentationModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1); // Batch size
  EXPECT_EQ(shape[1], 3); // RGB channels
}

TEST(SemanticSegmentationInheritedTests, GetAllInputShapesWorks) {
  SemanticSegmentation model(kValidSemanticSegmentationModelPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(SemanticSegmentationInheritedTests, GetMethodMetaWorks) {
  SemanticSegmentation model(kValidSemanticSegmentationModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(SemanticSegmentationInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  SemanticSegmentation model(kValidSemanticSegmentationModelPath, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(SemanticSegmentationInheritedTests, InputShapeIsSquare) {
  SemanticSegmentation model(kValidSemanticSegmentationModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape[2], shape[3]); // Height == Width for DeepLabV3
}

TEST(SemanticSegmentationConstantsTests, ClassLabelsHas21Entries) {
  EXPECT_EQ(constants::kDeeplabV3Resnet50Labels.size(), 21u);
}

TEST(SemanticSegmentationConstantsTests, ClassLabelsContainExpectedClasses) {
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
