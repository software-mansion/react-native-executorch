#include "BaseModelTests.h"
#include "VisionModelTests.h"
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/style_transfer/StyleTransfer.h>
#include <variant>

using namespace rnexecutorch;
using namespace rnexecutorch::models::style_transfer;
using namespace model_tests;

constexpr auto kValidStyleTransferModelPath =
    "style_transfer_candy_xnnpack_fp32.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

static JSTensorViewIn makeRgbView(std::vector<uint8_t> &buf, int32_t h,
                                  int32_t w) {
  buf.assign(static_cast<size_t>(h * w * 3), 128);
  return JSTensorViewIn{
      buf.data(), {h, w, 3}, executorch::aten::ScalarType::Byte};
}

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
    (void)model.generateFromString(kValidTestImagePath, false);
  }
};
} // namespace model_tests

using StyleTransferTypes = ::testing::Types<StyleTransfer>;
INSTANTIATE_TYPED_TEST_SUITE_P(StyleTransfer, CommonModelTest,
                               StyleTransferTypes);
INSTANTIATE_TYPED_TEST_SUITE_P(StyleTransfer, VisionModelTest,
                               StyleTransferTypes);

// ============================================================================
// generateFromString tests
// ============================================================================
TEST(StyleTransferGenerateTests, InvalidImagePathThrows) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg", false),
               RnExecutorchError);
}

TEST(StyleTransferGenerateTests, EmptyImagePathThrows) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("", false), RnExecutorchError);
}

TEST(StyleTransferGenerateTests, MalformedURIThrows) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("not_a_valid_uri://bad", false),
               RnExecutorchError);
}

TEST(StyleTransferGenerateTests, ValidImageReturnsFilePath) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath, false);
  ASSERT_TRUE(std::holds_alternative<PixelDataResult>(result));
  auto &pr = std::get<PixelDataResult>(result);
  EXPECT_NE(pr.dataPtr, nullptr);
  EXPECT_GT(pr.width, 0);
  EXPECT_GT(pr.height, 0);
}

// ============================================================================
// generateFromString saveToFile tests
// ============================================================================
TEST(StyleTransferSaveToFileTests, SaveToFileFalseReturnsValidPixelData) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath, false);
  ASSERT_TRUE(std::holds_alternative<PixelDataResult>(result));
  EXPECT_NE(std::get<PixelDataResult>(result).dataPtr, nullptr);
}

TEST(StyleTransferSaveToFileTests, SaveToFileFalseHasPositiveDimensions) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath, false);
  ASSERT_TRUE(std::holds_alternative<PixelDataResult>(result));
  auto &pr = std::get<PixelDataResult>(result);
  EXPECT_GT(pr.width, 0);
  EXPECT_GT(pr.height, 0);
}

TEST(StyleTransferSaveToFileTests, SaveToFileTrueReturnsStringVariant) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath, true);
  EXPECT_TRUE(std::holds_alternative<std::string>(result));
}

TEST(StyleTransferSaveToFileTests, SaveToFileTrueStringIsNonEmpty) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath, true);
  ASSERT_TRUE(std::holds_alternative<std::string>(result));
  EXPECT_FALSE(std::get<std::string>(result).empty());
}

TEST(StyleTransferSaveToFileTests, SaveToFileTrueStringHasFileScheme) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath, true);
  ASSERT_TRUE(std::holds_alternative<std::string>(result));
  EXPECT_TRUE(std::get<std::string>(result).starts_with("file://"));
}

// ============================================================================
// generateFromPixels tests
// ============================================================================
TEST(StyleTransferPixelTests, ValidPixelsSaveToFileFalseReturnsPixelData) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, false);
  ASSERT_TRUE(std::holds_alternative<PixelDataResult>(result));
  EXPECT_NE(std::get<PixelDataResult>(result).dataPtr, nullptr);
}

TEST(StyleTransferPixelTests, ValidPixelsSaveToFileFalseHasPositiveDimensions) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, false);
  ASSERT_TRUE(std::holds_alternative<PixelDataResult>(result));
  auto &pr = std::get<PixelDataResult>(result);
  EXPECT_GT(pr.width, 0);
  EXPECT_GT(pr.height, 0);
}

TEST(StyleTransferPixelTests,
     ValidPixelsSaveToFileTrueReturnsFileSchemeString) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, true);
  ASSERT_TRUE(std::holds_alternative<std::string>(result));
  EXPECT_TRUE(std::get<std::string>(result).starts_with("file://"));
}

TEST(StyleTransferPixelTests, OutputDimensionsMatchInputSize) {
  StyleTransfer model(kValidStyleTransferModelPath, nullptr);
  std::vector<uint8_t> buf;
  auto view = makeRgbView(buf, 64, 64);
  auto result = model.generateFromPixels(view, false);
  ASSERT_TRUE(std::holds_alternative<PixelDataResult>(result));
  auto &pr = std::get<PixelDataResult>(result);
  EXPECT_EQ(pr.width, 64);
  EXPECT_EQ(pr.height, 64);
}

// ============================================================================
// Inherited BaseModel tests
// ============================================================================
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
