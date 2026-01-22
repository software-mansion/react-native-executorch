#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/classification/Classification.h>
#include <rnexecutorch/models/classification/Constants.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::classification;

constexpr auto VALID_CLASSIFICATION_MODEL_PATH =
    "efficientnet_v2_s_xnnpack.pte";
constexpr auto VALID_TEST_IMAGE_PATH =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

TEST(ClassificationCtorTests, InvalidPathThrows) {
  EXPECT_THROW(Classification("this_file_does_not_exist.pte", nullptr),
               RnExecutorchError);
}

TEST(ClassificationCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(Classification(VALID_CLASSIFICATION_MODEL_PATH, nullptr));
}

TEST(ClassificationGenerateTests, InvalidImagePathThrows) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(ClassificationGenerateTests, ValidImageReturnsResults) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH);
  EXPECT_FALSE(results.empty());
}

TEST(ClassificationGenerateTests, ResultsHaveCorrectSize) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH);
  auto expectedNumClasses = constants::kImagenet1kV1Labels.size();
  EXPECT_EQ(results.size(), expectedNumClasses);
}

TEST(ClassificationGenerateTests, ResultsContainValidProbabilities) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH);

  float sum = 0.0f;
  for (const auto &[label, prob] : results) {
    EXPECT_GE(prob, 0.0f);
    EXPECT_LE(prob, 1.0f);
    sum += prob;
  }
  EXPECT_NEAR(sum, 1.0f, 0.01f);
}

TEST(ClassificationGenerateTests, TopPredictionHasReasonableConfidence) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  auto results = model.generate(VALID_TEST_IMAGE_PATH);

  float maxProb = 0.0f;
  for (const auto &[label, prob] : results) {
    if (prob > maxProb) {
      maxProb = prob;
    }
  }
  EXPECT_GT(maxProb, 0.0f);
}

TEST(ClassificationUnloadTests, GenerateAfterUnloadThrows) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  model.unload();
  EXPECT_THROW((void)model.generate(VALID_TEST_IMAGE_PATH), RnExecutorchError);
}

TEST(ClassificationInheritedTests, GetInputShapeWorks) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(ClassificationInheritedTests, GetAllInputShapesWorks) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ClassificationInheritedTests, GetMethodMetaWorks) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

TEST(ClassificationInheritedTests, GetMemoryLowerBoundReturnsPositive) {
  Classification model(VALID_CLASSIFICATION_MODEL_PATH, nullptr);
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}
