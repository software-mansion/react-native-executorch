#include <cmath>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::embeddings;

constexpr auto VALID_TEXT_EMBEDDINGS_MODEL_PATH =
    "all-MiniLM-L6-v2_xnnpack.pte";
constexpr auto VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH = "tokenizer.json";
constexpr size_t MINILM_EMBEDDING_DIMENSIONS = 384;

TEST(TextEmbeddingsCtorTests, InvalidModelPathThrows) {
  EXPECT_THROW(TextEmbeddings("this_file_does_not_exist.pte",
                              VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr),
               RnExecutorchError);
}

TEST(TextEmbeddingsCtorTests, InvalidTokenizerPathThrows) {
  EXPECT_THROW(TextEmbeddings(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                              "this_tokenizer_does_not_exist.json", nullptr),
               std::exception);
}

TEST(TextEmbeddingsCtorTests, ValidPathsDoesntThrow) {
  EXPECT_NO_THROW(TextEmbeddings(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                                 VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH,
                                 nullptr));
}

TEST(TextEmbeddingsGenerateTests, EmptyStringReturnsResults) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  auto result = model.generate("");
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(TextEmbeddingsGenerateTests, ValidTextReturnsResults) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  auto result = model.generate("Hello, world!");
  EXPECT_NE(result, nullptr);
  EXPECT_GT(result->size(), 0u);
}

TEST(TextEmbeddingsGenerateTests, ResultsHaveCorrectSize) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  auto result = model.generate("This is a test sentence.");
  size_t numFloats = result->size() / sizeof(float);
  EXPECT_EQ(numFloats, MINILM_EMBEDDING_DIMENSIONS);
}

TEST(TextEmbeddingsGenerateTests, ResultsAreNormalized) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
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
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  auto result = model.generate("Testing valid values.");

  const float *data = reinterpret_cast<const float *>(result->data());
  size_t numFloats = result->size() / sizeof(float);

  for (size_t i = 0; i < numFloats; ++i) {
    EXPECT_FALSE(std::isnan(data[i]));
    EXPECT_FALSE(std::isinf(data[i]));
  }
}

TEST(TextEmbeddingsGenerateTests, DifferentTextProducesDifferentEmbeddings) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);

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
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);

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

TEST(TextEmbeddingsUnloadTests, GenerateAfterUnloadThrows) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  model.unload();
  EXPECT_THROW(model.generate("Test"), RnExecutorchError);
}

TEST(TextEmbeddingsInheritedTests, GetInputShapeWorks) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_GE(shape.size(), 2u);
}

TEST(TextEmbeddingsInheritedTests, GetAllInputShapesWorks) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(TextEmbeddingsInheritedTests, GetMethodMetaWorks) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(TextEmbeddingsInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  TextEmbeddings model(VALID_TEXT_EMBEDDINGS_MODEL_PATH,
                       VALID_TEXT_EMBEDDINGS_TOKENIZER_PATH, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}
