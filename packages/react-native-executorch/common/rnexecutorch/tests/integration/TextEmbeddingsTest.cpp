#include "BaseModelTests.h"
#include <cmath>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::embeddings;
using namespace model_tests;

constexpr auto kValidTextEmbeddingsModelPath = "all-MiniLM-L6-v2_xnnpack.pte";
constexpr auto kValidTextEmbeddingsTokenizerPath = "tokenizer.json";
constexpr size_t kMiniLmEmbeddingDimensions = 384;

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<TextEmbeddings> {
  using ModelType = TextEmbeddings;

  static ModelType createValid() {
    return ModelType(kValidTextEmbeddingsModelPath,
                     kValidTextEmbeddingsTokenizerPath, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", kValidTextEmbeddingsTokenizerPath,
                     nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate("Hello, world!");
  }
};
} // namespace model_tests

using TextEmbeddingsTypes = ::testing::Types<TextEmbeddings>;
INSTANTIATE_TYPED_TEST_SUITE_P(TextEmbeddings, CommonModelTest,
                               TextEmbeddingsTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(TextEmbeddingsCtorTests, InvalidTokenizerPathThrows) {
  EXPECT_THROW(TextEmbeddings(kValidTextEmbeddingsModelPath,
                              "this_tokenizer_does_not_exist.json", nullptr),
               std::exception);
}

TEST(TextEmbeddingsGenerateTests, EmptyStringReturnsResults) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto result = model.generate("");
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(TextEmbeddingsGenerateTests, ValidTextReturnsResults) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto result = model.generate("Hello, world!");
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(TextEmbeddingsGenerateTests, ResultsHaveCorrectSize) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto result = model.generate("This is a test sentence.");
  size_t numFloats = result->size() / sizeof(float);
  EXPECT_EQ(numFloats, kMiniLmEmbeddingDimensions);
}

TEST(TextEmbeddingsGenerateTests, ResultsAreNormalized) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto result = model.generate("The quick brown fox jumps over the lazy dog.");

  const float *data = reinterpret_cast<const float *>(result->data());
  size_t numFloats = result->size() / sizeof(float);

  float sumOfSquares = 0.0f;
  for (size_t i = 0; i < numFloats; ++i) {
    sumOfSquares += data[i] * data[i];
  }
  float norm = std::sqrt(sumOfSquares);
  EXPECT_NEAR(norm, 1.0f, 0.01f);
}

TEST(TextEmbeddingsGenerateTests, ResultsContainValidValues) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto result = model.generate("Testing valid values.");

  const float *data = reinterpret_cast<const float *>(result->data());
  size_t numFloats = result->size() / sizeof(float);

  for (size_t i = 0; i < numFloats; ++i) {
    EXPECT_FALSE(std::isnan(data[i]));
    EXPECT_FALSE(std::isinf(data[i]));
  }
}

TEST(TextEmbeddingsGenerateTests, DifferentTextProducesDifferentEmbeddings) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);

  auto result1 = model.generate("Hello, world!");
  auto result2 = model.generate("Goodbye, moon!");

  const float *data1 = reinterpret_cast<const float *>(result1->data());
  const float *data2 = reinterpret_cast<const float *>(result2->data());
  size_t numFloats = result1->size() / sizeof(float);

  bool allEqual = true;
  for (size_t i = 0; i < numFloats; ++i) {
    if (std::abs(data1[i] - data2[i]) > 1e-6f) {
      allEqual = false;
      break;
    }
  }
  EXPECT_FALSE(allEqual);
}

TEST(TextEmbeddingsGenerateTests, SimilarTextProducesSimilarEmbeddings) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);

  auto result1 = model.generate("I love programming");
  auto result2 = model.generate("I enjoy coding");

  const float *data1 = reinterpret_cast<const float *>(result1->data());
  const float *data2 = reinterpret_cast<const float *>(result2->data());
  size_t numFloats = result1->size() / sizeof(float);

  float dotProduct = 0.0f;
  for (size_t i = 0; i < numFloats; ++i) {
    dotProduct += data1[i] * data2[i];
  }
  EXPECT_GT(dotProduct, 0.5f);
}

TEST(TextEmbeddingsInheritedTests, GetInputShapeWorks) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_GE(shape.size(), 2u);
}

TEST(TextEmbeddingsInheritedTests, GetAllInputShapesWorks) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(TextEmbeddingsInheritedTests, GetMethodMetaWorks) {
  TextEmbeddings model(kValidTextEmbeddingsModelPath,
                       kValidTextEmbeddingsTokenizerPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}
