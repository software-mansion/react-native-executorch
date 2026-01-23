#include "BaseModelTests.h"
#include <cmath>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/embeddings/image/ImageEmbeddings.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::embeddings;
using namespace model_tests;

constexpr auto VALID_IMAGE_EMBEDDINGS_MODEL_PATH =
    "clip-vit-base-patch32-vision_xnnpack.pte";
constexpr auto VALID_TEST_IMAGE_PATH =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";
constexpr size_t CLIP_EMBEDDING_DIMENSIONS = 512;

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<ImageEmbeddings> {
  using ModelType = ImageEmbeddings;

  static ModelType createValid() {
    return ModelType(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate(VALID_TEST_IMAGE_PATH);
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
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(ImageEmbeddingsGenerateTests, ValidImageReturnsResults) {
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  auto result = model.generate(VALID_TEST_IMAGE_PATH);
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(ImageEmbeddingsGenerateTests, ResultsHaveCorrectSize) {
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  auto result = model.generate(VALID_TEST_IMAGE_PATH);
  size_t numFloats = result->size() / sizeof(float);
  EXPECT_EQ(numFloats, CLIP_EMBEDDING_DIMENSIONS);
}

TEST(ImageEmbeddingsGenerateTests, ResultsAreNormalized) {
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  auto result = model.generate(VALID_TEST_IMAGE_PATH);

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
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  auto result = model.generate(VALID_TEST_IMAGE_PATH);

  const float *data = reinterpret_cast<const float *>(result->data());
  size_t numFloats = result->size() / sizeof(float);

  for (size_t i = 0; i < numFloats; ++i) {
    EXPECT_FALSE(std::isnan(data[i]));
    EXPECT_FALSE(std::isinf(data[i]));
  }
}

TEST(ImageEmbeddingsInheritedTests, GetInputShapeWorks) {
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(ImageEmbeddingsInheritedTests, GetAllInputShapesWorks) {
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ImageEmbeddingsInheritedTests, GetMethodMetaWorks) {
  ImageEmbeddings model(VALID_IMAGE_EMBEDDINGS_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}
