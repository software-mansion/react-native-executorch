#include "BaseModelTests.h"
#include "TestUtils.h"
#include <filesystem>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::style_transfer;
using namespace model_tests;

constexpr auto VALID_STYLE_TRANSFER_MODEL_PATH =
    "style_transfer_candy_xnnpack.pte";
constexpr auto VALID_TEST_IMAGE_PATH =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<StyleTransfer> {
  using ModelType = StyleTransfer;

  static ModelType createValid() {
    return ModelType(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate(VALID_TEST_IMAGE_PATH);
  }
};
} // namespace model_tests

using StyleTransferTypes = ::testing::Types<StyleTransfer>;
INSTANTIATE_TYPED_TEST_SUITE_P(StyleTransfer, CommonModelTest,
                               StyleTransferTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(StyleTransferGenerateTests, InvalidImagePathThrows) {
  StyleTransfer model(VALID_STYLE_TRANSFER_MODEL_PATH, nullptr);
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
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
  EXPECT_NO_THROW((void)model.generate(VALID_TEST_IMAGE_PATH));
  auto result1 = model.generate(VALID_TEST_IMAGE_PATH);
  auto result2 = model.generate(VALID_TEST_IMAGE_PATH);
  test_utils::trimFilePrefix(result1);
  test_utils::trimFilePrefix(result2);
  EXPECT_TRUE(std::filesystem::exists(result1));
  EXPECT_TRUE(std::filesystem::exists(result2));
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
