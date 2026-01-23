#include <executorch/extension/tensor/tensor.h>
#include <gtest/gtest.h>
#include <limits>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/BaseModel.h>
#include <vector>

using namespace rnexecutorch;
using namespace rnexecutorch::models;
using namespace executorch::extension;
using executorch::runtime::EValue;

constexpr auto VALID_STYLE_TRANSFER_MODEL_PATH =
    "style_transfer_candy_xnnpack.pte";

TEST(BaseModelCtorTests, InvalidPathThrows) {
  EXPECT_THROW(BaseModel("this_file_does_not_exist.mp3", nullptr),
               RnExecutorchError);
}

TEST(BaseModelCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(BaseModel(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr));
}

TEST(BaseModelGetInputShapeTests, ValidMethodCorrectShape) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto forwardShape = model.getInputShape("forward", 0);
  std::vector<int32_t> expectedShape = {1, 3, 640, 640};
  EXPECT_EQ(forwardShape, expectedShape);
}

TEST(BaseModelGetInputShapeTests, InvalidMethodThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_THROW((void)model.getInputShape("this_method_does_not_exist", 0),
               RnExecutorchError);
}

TEST(BaseModelGetInputShapeTests, ValidMethodInvalidIndexThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_THROW(
      (void)model.getInputShape("forward", std::numeric_limits<int32_t>::min()),
      RnExecutorchError);
}

TEST(BaseModelGetAllInputShapesTests, ValidMethodReturnsShapes) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto allShapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(allShapes.empty());
  std::vector<int32_t> expectedFirstShape = {1, 3, 640, 640};
  EXPECT_EQ(allShapes[0], expectedFirstShape);
}

TEST(BaseModelGetAllInputShapesTests, InvalidMethodThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_THROW(model.getAllInputShapes("non_existent_method"),
               RnExecutorchError);
}

TEST(BaseModelGetMethodMetaTests, ValidMethodReturnsOk) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(BaseModelGetMethodMetaTests, InvalidMethodReturnsError) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("non_existent_method");
  EXPECT_FALSE(result.ok());
}

TEST(BaseModelUnloadTests, UnloadDoesNotThrow) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_NO_THROW(model.unload());
}

TEST(BaseModelUnloadTests, GetInputShapeAfterUnloadThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  model.unload();
  EXPECT_THROW((void)model.getInputShape("forward", 0), RnExecutorchError);
}

TEST(BaseModelUnloadTests, GetAllInputShapesAfterUnloadThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  model.unload();
  EXPECT_THROW(model.getAllInputShapes("forward"), RnExecutorchError);
}

TEST(BaseModelUnloadTests, GetMethodMetaAfterUnloadThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  model.unload();
  EXPECT_THROW(model.getMethodMeta("forward"), RnExecutorchError);
}

TEST(BaseModelMemoryTests, GetMemoryLowerBoundReturnsPositive) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(BaseModelForwardTests, ForwardWithValidInputReturnsOk) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);
  auto tensorPtr = make_tensor_ptr(shape, inputData.data());
  EValue input(*tensorPtr);

  auto result = model.forward(input);
  EXPECT_TRUE(result.ok());
}

TEST(BaseModelForwardTests, ForwardWithVectorInputReturnsOk) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);
  auto tensorPtr = make_tensor_ptr(shape, inputData.data());
  std::vector<EValue> inputs;
  inputs.emplace_back(*tensorPtr);

  auto result = model.forward(inputs);
  EXPECT_TRUE(result.ok());
}

TEST(BaseModelForwardTests, ForwardReturnsCorrectOutputShape) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);
  auto tensorPtr = make_tensor_ptr(shape, inputData.data());
  EValue input(*tensorPtr);

  auto result = model.forward(input);
  ASSERT_TRUE(result.ok());
  ASSERT_FALSE(result->empty());

  auto &outputTensor = result->at(0).toTensor();
  auto outputSizes = outputTensor.sizes();
  EXPECT_EQ(outputSizes.size(), 4);
  EXPECT_EQ(outputSizes[0], 1);
  EXPECT_EQ(outputSizes[1], 3);
  EXPECT_EQ(outputSizes[2], 640);
  EXPECT_EQ(outputSizes[3], 640);
}

TEST(BaseModelForwardTests, ForwardAfterUnloadThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  model.unload();

  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);
  auto tensorPtr = make_tensor_ptr(shape, inputData.data());
  EValue input(*tensorPtr);

  EXPECT_THROW(model.forward(input), RnExecutorchError);
}

TEST(BaseModelForwardJSTests, ForwardJSWithValidInputReturnsOutput) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);

  JSTensorViewIn tensorView;
  tensorView.dataPtr = inputData.data();
  tensorView.sizes = shape;
  tensorView.scalarType = executorch::aten::ScalarType::Float;

  std::vector<JSTensorViewIn> inputs = {tensorView};
  auto outputs = model.forwardJS(inputs);

  EXPECT_FALSE(outputs.empty());
}

TEST(BaseModelForwardJSTests, ForwardJSReturnsCorrectOutputShape) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);

  JSTensorViewIn tensorView;
  tensorView.dataPtr = inputData.data();
  tensorView.sizes = shape;
  tensorView.scalarType = executorch::aten::ScalarType::Float;

  std::vector<JSTensorViewIn> inputs = {tensorView};
  auto outputs = model.forwardJS(inputs);

  ASSERT_EQ(outputs.size(), 1);
  std::vector<int32_t> expectedShape = {1, 3, 640, 640};
  EXPECT_EQ(outputs[0].sizes, expectedShape);
}

TEST(BaseModelForwardJSTests, ForwardJSAfterUnloadThrows) {
  BaseModel model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  model.unload();

  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);

  JSTensorViewIn tensorView;
  tensorView.dataPtr = inputData.data();
  tensorView.sizes = shape;
  tensorView.scalarType = executorch::aten::ScalarType::Float;

  std::vector<JSTensorViewIn> inputs = {tensorView};
  EXPECT_THROW((void)model.forwardJS(inputs), RnExecutorchError);
}
