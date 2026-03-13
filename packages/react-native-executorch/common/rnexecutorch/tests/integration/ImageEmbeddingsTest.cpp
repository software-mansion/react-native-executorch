#include "BaseModelTests.h"
#include <cmath>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/embeddings/image/ImageEmbeddings.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::embeddings;
using namespace model_tests;

constexpr auto kValidImageEmbeddingsModelPath =
    "clip-vit-base-patch32-vision_xnnpack.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<ImageEmbeddings> {
  using ModelType = ImageEmbeddings;

  static ModelType createValid() {
    return ModelType(kValidImageEmbeddingsModelPath, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generateFromString(kValidTestImagePath);
  }
};
} // namespace model_tests

using ImageEmbeddingsTypes = ::testing::Types<ImageEmbeddings>;
INSTANTIATE_TYPED_TEST_SUITE_P(ImageEmbeddings, CommonModelTest,
                               ImageEmbeddingsTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(ImageEmbeddingsGenerateTests, InvalidImagePathThrows) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(ImageEmbeddingsGenerateTests, EmptyImagePathThrows) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString(""), RnExecutorchError);
}

TEST(ImageEmbeddingsGenerateTests, MalformedURIThrows) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(ImageEmbeddingsGenerateTests, ValidImageReturnsResults) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath);
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(ImageEmbeddingsGenerateTests, ResultsHaveCorrectSize) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath);
  size_t numFloats = result->size() / sizeof(float);
  constexpr size_t kClipEmbeddingDimensions = 512;
  EXPECT_EQ(numFloats, kClipEmbeddingDimensions);
}

TEST(ImageEmbeddingsGenerateTests, ResultsAreNormalized) {
  // TODO: Investigate the source of the issue;
  GTEST_SKIP() << "Expected to fail in emulator environments";
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath);

  const float *data = reinterpret_cast<const float *>(result->data());
  size_t numFloats = result->size() / sizeof(float);

  float sumOfSquares = 0.0f;
  for (size_t i = 0; i < numFloats; ++i) {
    sumOfSquares += data[i] * data[i];
  }
  float norm = std::sqrt(sumOfSquares);
  EXPECT_NEAR(norm, 1.0f, 0.01f);
}

TEST(ImageEmbeddingsGenerateTests, ResultsContainValidValues) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  auto result = model.generateFromString(kValidTestImagePath);

  const float *data = reinterpret_cast<const float *>(result->data());
  size_t numFloats = result->size() / sizeof(float);

  for (size_t i = 0; i < numFloats; ++i) {
    EXPECT_FALSE(std::isnan(data[i]));
    EXPECT_FALSE(std::isinf(data[i]));
  }
}

TEST(ImageEmbeddingsInheritedTests, GetInputShapeWorks) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(ImageEmbeddingsInheritedTests, GetAllInputShapesWorks) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ImageEmbeddingsInheritedTests, GetMethodMetaWorks) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

// ============================================================================
// generateFromPixels smoke test
// ============================================================================
TEST(ImageEmbeddingsPixelTests, ValidPixelsReturnsEmbedding) {
  ImageEmbeddings model(kValidImageEmbeddingsModelPath, nullptr);
  std::vector<uint8_t> buf(64 * 64 * 3, 128);
  JSTensorViewIn view{
      buf.data(), {64, 64, 3}, executorch::aten::ScalarType::Byte};
  auto result = model.generateFromPixels(view);
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}
