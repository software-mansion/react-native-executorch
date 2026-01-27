#include "BaseModelTests.h"
#include <executorch/extension/tensor/tensor.h>
#include <gtest/gtest.h>
#include <limits>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/BaseModel.h>
#include <vector>

using namespace rnexecutorch;
using namespace rnexecutorch::models;
using namespace executorch::extension;
using namespace model_tests;
using executorch::runtime::EValue;

constexpr auto kValidStyleTransferModelPath =
    "style_transfer_candy_xnnpack.pte";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<BaseModel> {
  using ModelType = BaseModel;

  static ModelType createValid() {
    return ModelType(kValidStyleTransferModelPath, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    std::vector<int32_t> shape = {1, 3, 640, 640};
    size_t numElements = 1 * 3 * 640 * 640;
    std::vector<float> inputData(numElements, 0.5f);
    auto tensorPtr = make_tensor_ptr(shape, inputData.data());
    EValue input(*tensorPtr);
    (void)model.forward(input);
  }
};
} // namespace model_tests

using BaseModelTypes = ::testing::Types<BaseModel>;
INSTANTIATE_TYPED_TEST_SUITE_P(BaseModel, CommonModelTest, BaseModelTypes);

// ============================================================================
// BaseModel-specific tests (methods not in all models)
// ============================================================================

TEST(BaseModelGetInputShapeTests, ValidMethodCorrectShape) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  auto forwardShape = model.getInputShape("forward", 0);
  std::vector<int32_t> expectedShape = {1, 3, 640, 640};
  EXPECT_EQ(forwardShape, expectedShape);
}

TEST(BaseModelGetInputShapeTests, InvalidMethodThrows) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW((void)model.getInputShape("this_method_does_not_exist", 0),
               RnExecutorchError);
}

TEST(BaseModelGetInputShapeTests, ValidMethodInvalidIndexThrows) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW(
      (void)model.getInputShape("forward", std::numeric_limits<int32_t>::min()),
      RnExecutorchError);
}

TEST(BaseModelGetAllInputShapesTests, ValidMethodReturnsShapes) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  auto allShapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(allShapes.empty());
  std::vector<int32_t> expectedFirstShape = {1, 3, 640, 640};
  EXPECT_EQ(allShapes[0], expectedFirstShape);
}

TEST(BaseModelGetAllInputShapesTests, InvalidMethodThrows) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW(model.getAllInputShapes("non_existent_method"),
               RnExecutorchError);
}

TEST(BaseModelGetMethodMetaTests, ValidMethodReturnsOk) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(BaseModelGetMethodMetaTests, InvalidMethodReturnsError) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  auto result = model.getMethodMeta("non_existent_method");
  EXPECT_FALSE(result.ok());
}

TEST(BaseModelForwardTests, ForwardWithValidInputReturnsOk) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);
  auto tensorPtr = make_tensor_ptr(shape, inputData.data());
  EValue input(*tensorPtr);

  auto result = model.forward(input);
  EXPECT_TRUE(result.ok());
}

TEST(BaseModelForwardTests, ForwardWithVectorInputReturnsOk) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
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
  BaseModel model(kValidStyleTransferModelPath, nullptr);
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
  BaseModel model(kValidStyleTransferModelPath, nullptr);
  model.unload();

  std::vector<int32_t> shape = {1, 3, 640, 640};
  size_t numElements = 1 * 3 * 640 * 640;
  std::vector<float> inputData(numElements, 0.5f);
  auto tensorPtr = make_tensor_ptr(shape, inputData.data());
  EValue input(*tensorPtr);

  EXPECT_THROW(model.forward(input), RnExecutorchError);
}

TEST(BaseModelForwardJSTests, ForwardJSWithValidInputReturnsOutput) {
  BaseModel model(kValidStyleTransferModelPath, nullptr);
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
  BaseModel model(kValidStyleTransferModelPath, nullptr);
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
  BaseModel model(kValidStyleTransferModelPath, nullptr);
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
