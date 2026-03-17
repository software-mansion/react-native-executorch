#include "BaseModelTests.h"
#include "VisionModelTests.h"
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/classification/Classification.h>
#include <rnexecutorch/models/classification/Constants.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::classification;
using namespace model_tests;

constexpr auto kValidClassificationModelPath = "efficientnet_v2_s_xnnpack.pte";
constexpr auto kValidTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/test_image.jpg";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<Classification> {
  using ModelType = Classification;

  static ModelType createValid() {
    return ModelType(kValidClassificationModelPath, nullptr);
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", nullptr);
  }

  static void callGenerate(ModelType &model) {
    (void)model.generateFromString(kValidTestImagePath);
  }
};
} // namespace model_tests

using ClassificationTypes = ::testing::Types<Classification>;
INSTANTIATE_TYPED_TEST_SUITE_P(Classification, CommonModelTest,
                               ClassificationTypes);
INSTANTIATE_TYPED_TEST_SUITE_P(Classification, VisionModelTest,
                               ClassificationTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(ClassificationGenerateTests, InvalidImagePathThrows) {
  Classification model(kValidClassificationModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(ClassificationGenerateTests, EmptyImagePathThrows) {
  Classification model(kValidClassificationModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString(""), RnExecutorchError);
}

TEST(ClassificationGenerateTests, MalformedURIThrows) {
  Classification model(kValidClassificationModelPath, nullptr);
  EXPECT_THROW((void)model.generateFromString("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(ClassificationGenerateTests, ValidImageReturnsResults) {
  Classification model(kValidClassificationModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath);
  EXPECT_FALSE(results.empty());
}

TEST(ClassificationGenerateTests, ResultsHaveCorrectSize) {
  Classification model(kValidClassificationModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath);
  auto expectedNumClasses = constants::kImagenet1kV1Labels.size();
  EXPECT_EQ(results.size(), expectedNumClasses);
}

TEST(ClassificationGenerateTests, ResultsContainValidProbabilities) {
  Classification model(kValidClassificationModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath);

  float sum = 0.0f;
  for (const auto &[label, prob] : results) {
    EXPECT_GE(prob, 0.0f);
    EXPECT_LE(prob, 1.0f);
    sum += prob;
  }
  EXPECT_NEAR(sum, 1.0f, 0.01f);
}

TEST(ClassificationGenerateTests, TopPredictionHasReasonableConfidence) {
  Classification model(kValidClassificationModelPath, nullptr);
  auto results = model.generateFromString(kValidTestImagePath);

  float maxProb = 0.0f;
  for (const auto &[label, prob] : results) {
    if (prob > maxProb) {
      maxProb = prob;
    }
  }
  EXPECT_GT(maxProb, 0.0f);
}

TEST(ClassificationInheritedTests, GetInputShapeWorks) {
  Classification model(kValidClassificationModelPath, nullptr);
  auto shape = model.getInputShape("forward", 0);
  EXPECT_EQ(shape.size(), 4);
  EXPECT_EQ(shape[0], 1);
  EXPECT_EQ(shape[1], 3);
}

TEST(ClassificationInheritedTests, GetAllInputShapesWorks) {
  Classification model(kValidClassificationModelPath, nullptr);
  auto shapes = model.getAllInputShapes("forward");
  EXPECT_FALSE(shapes.empty());
}

TEST(ClassificationInheritedTests, GetMethodMetaWorks) {
  Classification model(kValidClassificationModelPath, nullptr);
  auto result = model.getMethodMeta("forward");
  EXPECT_TRUE(result.ok());
}

// ============================================================================
// generateFromPixels smoke test
// ============================================================================
TEST(ClassificationPixelTests, ValidPixelsReturnsResults) {
  Classification model(kValidClassificationModelPath, nullptr);
  std::vector<uint8_t> buf(64 * 64 * 3, 128);
  JSTensorViewIn view{
      buf.data(), {64, 64, 3}, executorch::aten::ScalarType::Byte};
  auto results = model.generateFromPixels(view);
  EXPECT_FALSE(results.empty());
}
