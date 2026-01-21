#include "TestUtils.h"
#include <filesystem>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::style_transfer;

constexpr auto VALID_STYLE_TRANSFER_MODEL_PATH =
    "style_transfer_candy_xnnpack.pte";
constexpr auto VALID_TEST_IMAGE_PATH =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

TEST(StyleTransferCtorTests, InvalidPathThrows) {
  EXPECT_THROW(StyleTransfer("this_file_does_not_exist.pte", nullptr),
               RnExecutorchError);
}

TEST(StyleTransferCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(StyleTransfer(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr));
}

TEST(StyleTransferGenerateTests, InvalidImagePathThrows) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_THROW(model.generate("nonexistent_image.jpg"), RnExecutorchError);
}

TEST(StyleTransferGenerateTests, ValidImageReturnsFilePath) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto result = model.generate(VALID_TEST_IMAGE_PATH);
  EXPECT_FALSE(result.empty());
}

TEST(StyleTransferGenerateTests, ResultIsValidFilePath) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto result = model.generate(VALID_TEST_IMAGE_PATH);
  test_utils::trimFilePrefix(result);
  EXPECT_TRUE(std::filesystem::exists(result));
}

TEST(StyleTransferGenerateTests, ResultFileHasContent) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto result = model.generate(VALID_TEST_IMAGE_PATH);
  test_utils::trimFilePrefix(result);
  auto fileSize = std::filesystem::file_size(result);
  EXPECT_GT(fileSize, 0u);
}

TEST(StyleTransferGenerateTests, MultipleGeneratesWork) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_NO_THROW(model.generate(VALID_TEST_IMAGE_PATH));
  auto result1 = model.generate(VALID_TEST_IMAGE_PATH);
  auto result2 = model.generate(VALID_TEST_IMAGE_PATH);
  test_utils::trimFilePrefix(result1);
  test_utils::trimFilePrefix(result2);
  EXPECT_TRUE(std::filesystem::exists(result1));
  EXPECT_TRUE(std::filesystem::exists(result2));
}

TEST(StyleTransferUnloadTests, GenerateAfterUnloadThrows) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  model.unload();
  EXPECT_THROW(model.generate(VALID_TEST_IMAGE_PATH), RnExecutorchError);
}

TEST(StyleTransferInheritedTests, GetInputShapeWorks) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(StyleTransferInheritedTests, GetAllInputShapesWorks) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(StyleTransferInheritedTests, GetMethodMetaWorks) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(StyleTransferInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}
