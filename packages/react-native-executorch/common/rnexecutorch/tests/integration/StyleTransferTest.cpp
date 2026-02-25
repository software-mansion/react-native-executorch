#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::style_transfer;
using namespace model_tests;

constexpr auto kValidStyleTransferModelPath =
    "style_transfer_candy_xnnpack.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<StyleTransfer> {
  using ModelType = StyleTransfer;

  static ModelType createValid() {
    return ModelType(kValidStyleTransferModelPath, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generateFromString(kValidTestImagePath);
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
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(StyleTransferGenerateTests, EmptyImagePathThrows) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString(""), RnExecutorchError);
}

TEST(StyleTransferGenerateTests, MalformedURIThrows) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(StyleTransferGenerateTests, ValidImageReturnsNonNull) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath);
  EXPECT_NE(result, nullptr);
}

TEST(StyleTransferGenerateTests, MultipleGeneratesWork) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  EXPECT_NO_THROW((void)model.generateFromString(kValidTestImagePath));
  auto result1 = model.generateFromString(kValidTestImagePath);
  auto result2 = model.generateFromString(kValidTestImagePath);
  EXPECT_NE(result1, nullptr);
  EXPECT_NE(result2, nullptr);
}

TEST(StyleTransferInheritedTests, GetInputShapeWorks) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(StyleTransferInheritedTests, GetAllInputShapesWorks) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(StyleTransferInheritedTests, GetMethodMetaWorks) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}
