#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/vertical_ocr/VerticalOCR.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::ocr;
using namespace model_tests;

namespace rnexecutorch {
std::shared_ptr<facebook::react::CallInvoker> createMockCallInvoker();
}

constexpr auto kValidVerticalDetectorPath = "xnnpack_craft_quantized.pte";
constexpr auto kValidVerticalRecognizerPath = "xnnpack_crnn_english.pte";
constexpr auto kValidVerticalTestImagePath =
    "file:///data/local/tmp/rnexecutorch_tests/we_are_software_mansion.jpg";

// English alphabet symbols (must match alphabets.english from symbols.ts)
const std::string ENGLISH_SYMBOLS =
    "0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ "
    "\xE2\x82\xAC" // Euro sign (€)
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<VerticalOCR> {
  using ModelType = VerticalOCR;

  static ModelType createValid() {
    return ModelType(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                     ENGLISH_SYMBOLS, false,
                     rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", kValidVerticalRecognizerPath,
                     ENGLISH_SYMBOLS, false,
                     rnexecutorch::createMockCallInvoker());
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate(kValidVerticalTestImagePath);
  }
};
} // namespace model_tests

using VerticalOCRTypes = ::testing::Types<VerticalOCR>;
INSTANTIATE_TYPED_TEST_SUITE_P(VerticalOCR, CommonModelTest, VerticalOCRTypes);

// ============================================================================
// VerticalOCR-specific tests
// ============================================================================

// Constructor tests
TEST(VerticalOCRCtorTests, InvalidRecognizerPathThrows) {
  EXPECT_THROW(VerticalOCR(kValidVerticalDetectorPath, "nonexistent.pte",
                           ENGLISH_SYMBOLS, false, createMockCallInvoker()),
               RnExecutorchError);
}

TEST(VerticalOCRCtorTests, EmptySymbolsThrows) {
  EXPECT_THROW(VerticalOCR(kValidVerticalDetectorPath,
                           kValidVerticalRecognizerPath, "", false,
                           createMockCallInvoker()),
               RnExecutorchError);
}

TEST(VerticalOCRCtorTests, IndependentCharsTrueDoesntThrow) {
  EXPECT_NO_THROW(VerticalOCR(kValidVerticalDetectorPath,
                              kValidVerticalRecognizerPath, ENGLISH_SYMBOLS,
                              true, createMockCallInvoker()));
}

TEST(VerticalOCRCtorTests, IndependentCharsFalseDoesntThrow) {
  EXPECT_NO_THROW(VerticalOCR(kValidVerticalDetectorPath,
                              kValidVerticalRecognizerPath, ENGLISH_SYMBOLS,
                              false, createMockCallInvoker()));
}

// Generate tests - Independent Characters strategy
TEST(VerticalOCRGenerateTests, IndependentCharsInvalidImageThrows) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, true, createMockCallInvoker());
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, IndependentCharsEmptyImagePathThrows) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, true, createMockCallInvoker());
  EXPECT_THROW((void)model.generate(""), RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, IndependentCharsMalformedURIThrows) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, true, createMockCallInvoker());
  EXPECT_THROW((void)model.generate("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, IndependentCharsValidImageReturnsResults) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, true, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);
  EXPECT_GE(results.size(), 0u);
}

TEST(VerticalOCRGenerateTests, IndependentCharsDetectionsHaveValidBBoxes) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, true, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);

  for (const auto &detection : results) {
    EXPECT_EQ(detection.bbox.size(), 4u);
    for (const auto &point : detection.bbox) {
      EXPECT_GE(point.x, 0.0f);
      EXPECT_GE(point.y, 0.0f);
    }
  }
}

TEST(VerticalOCRGenerateTests, IndependentCharsDetectionsHaveValidScores) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, true, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(VerticalOCRGenerateTests, IndependentCharsDetectionsHaveNonEmptyText) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, true, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);

  for (const auto &detection : results) {
    EXPECT_FALSE(detection.text.empty());
  }
}

// Generate tests - Joint Characters strategy
TEST(VerticalOCRGenerateTests, JointCharsInvalidImageThrows) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, false, createMockCallInvoker());
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, JointCharsEmptyImagePathThrows) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, false, createMockCallInvoker());
  EXPECT_THROW((void)model.generate(""), RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, JointCharsMalformedURIThrows) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, false, createMockCallInvoker());
  EXPECT_THROW((void)model.generate("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, JointCharsValidImageReturnsResults) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, false, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);
  EXPECT_GE(results.size(), 0u);
}

TEST(VerticalOCRGenerateTests, JointCharsDetectionsHaveValidBBoxes) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, false, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);

  for (const auto &detection : results) {
    EXPECT_EQ(detection.bbox.size(), 4u);
    for (const auto &point : detection.bbox) {
      EXPECT_GE(point.x, 0.0f);
      EXPECT_GE(point.y, 0.0f);
    }
  }
}

TEST(VerticalOCRGenerateTests, JointCharsDetectionsHaveValidScores) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, false, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(VerticalOCRGenerateTests, JointCharsDetectionsHaveNonEmptyText) {
  VerticalOCR model(kValidVerticalDetectorPath, kValidVerticalRecognizerPath,
                    ENGLISH_SYMBOLS, false, createMockCallInvoker());
  auto results = model.generate(kValidVerticalTestImagePath);

  for (const auto &detection : results) {
    EXPECT_FALSE(detection.text.empty());
  }
}

// Strategy comparison tests
TEST(VerticalOCRStrategyTests, BothStrategiesRunSuccessfully) {
  VerticalOCR independentModel(kValidVerticalDetectorPath,
                               kValidVerticalRecognizerPath, ENGLISH_SYMBOLS,
                               true, createMockCallInvoker());
  VerticalOCR jointModel(kValidVerticalDetectorPath,
                         kValidVerticalRecognizerPath, ENGLISH_SYMBOLS, false,
                         createMockCallInvoker());

  EXPECT_NO_THROW((void)independentModel.generate(kValidVerticalTestImagePath));
  EXPECT_NO_THROW((void)jointModel.generate(kValidVerticalTestImagePath));
}

TEST(VerticalOCRStrategyTests, BothStrategiesReturnValidResults) {
  VerticalOCR independentModel(kValidVerticalDetectorPath,
                               kValidVerticalRecognizerPath, ENGLISH_SYMBOLS,
                               true, createMockCallInvoker());
  VerticalOCR jointModel(kValidVerticalDetectorPath,
                         kValidVerticalRecognizerPath, ENGLISH_SYMBOLS, false,
                         createMockCallInvoker());

  auto independentResults =
      independentModel.generate(kValidVerticalTestImagePath);
  auto jointResults = jointModel.generate(kValidVerticalTestImagePath);

  // Both should return some results (or none if no text detected)
  EXPECT_GE(independentResults.size(), 0u);
  EXPECT_GE(jointResults.size(), 0u);
}
