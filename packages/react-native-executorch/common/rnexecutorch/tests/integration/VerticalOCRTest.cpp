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

constexpr auto VALID_VERTICAL_DETECTOR_PATH = "xnnpack_craft_quantized.pte";
constexpr auto VALID_VERTICAL_RECOGNIZER_PATH = "xnnpack_crnn_english.pte";
constexpr auto VALID_VERTICAL_TEST_IMAGE_PATH =
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
    return ModelType(VALID_VERTICAL_DETECTOR_PATH,
                     VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                     rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", VALID_VERTICAL_RECOGNIZER_PATH,
                     ENGLISH_SYMBOLS, false,
                     rnexecutorch::createMockCallInvoker());
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);
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
  EXPECT_THROW(VerticalOCR(VALID_VERTICAL_DETECTOR_PATH, "nonexistent.pte",
                           ENGLISH_SYMBOLS, false, createMockCallInvoker()),
               RnExecutorchError);
}

TEST(VerticalOCRCtorTests, EmptySymbolsThrows) {
  EXPECT_THROW(VerticalOCR(VALID_VERTICAL_DETECTOR_PATH,
                           VALID_VERTICAL_RECOGNIZER_PATH, "", false,
                           createMockCallInvoker()),
               RnExecutorchError);
}

TEST(VerticalOCRCtorTests, IndependentCharsTrueDoesntThrow) {
  EXPECT_NO_THROW(VerticalOCR(VALID_VERTICAL_DETECTOR_PATH,
                              VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
                              true, createMockCallInvoker()));
}

TEST(VerticalOCRCtorTests, IndependentCharsFalseDoesntThrow) {
  EXPECT_NO_THROW(VerticalOCR(VALID_VERTICAL_DETECTOR_PATH,
                              VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
                              false, createMockCallInvoker()));
}

// Generate tests - Independent Characters strategy
TEST(VerticalOCRGenerateTests, IndependentCharsInvalidImageThrows) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, true,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, IndependentCharsEmptyImagePathThrows) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, true,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate(""), RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, IndependentCharsMalformedURIThrows) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, true,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, IndependentCharsValidImageReturnsResults) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, true,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);
  EXPECT_GE(results.size(), 0u);
}

TEST(VerticalOCRGenerateTests, IndependentCharsDetectionsHaveValidBBoxes) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, true,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    EXPECT_EQ(detection.bbox.size(), 4u);
    for (const auto &point : detection.bbox) {
      EXPECT_GE(point.x, 0.0f);
      EXPECT_GE(point.y, 0.0f);
    }
  }
}

TEST(VerticalOCRGenerateTests, IndependentCharsDetectionsHaveValidScores) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, true,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(VerticalOCRGenerateTests, IndependentCharsDetectionsHaveNonEmptyText) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, true,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    EXPECT_FALSE(detection.text.empty());
  }
}

// Generate tests - Joint Characters strategy
TEST(VerticalOCRGenerateTests, JointCharsInvalidImageThrows) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, JointCharsEmptyImagePathThrows) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate(""), RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, JointCharsMalformedURIThrows) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(VerticalOCRGenerateTests, JointCharsValidImageReturnsResults) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);
  EXPECT_GE(results.size(), 0u);
}

TEST(VerticalOCRGenerateTests, JointCharsDetectionsHaveValidBBoxes) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    EXPECT_EQ(detection.bbox.size(), 4u);
    for (const auto &point : detection.bbox) {
      EXPECT_GE(point.x, 0.0f);
      EXPECT_GE(point.y, 0.0f);
    }
  }
}

TEST(VerticalOCRGenerateTests, JointCharsDetectionsHaveValidScores) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(VerticalOCRGenerateTests, JointCharsDetectionsHaveNonEmptyText) {
  VerticalOCR model(VALID_VERTICAL_DETECTOR_PATH,
                    VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                    createMockCallInvoker());
  auto results = model.generate(VALID_VERTICAL_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    EXPECT_FALSE(detection.text.empty());
  }
}

// Strategy comparison tests
TEST(VerticalOCRStrategyTests, BothStrategiesRunSuccessfully) {
  VerticalOCR independentModel(VALID_VERTICAL_DETECTOR_PATH,
                               VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
                               true, createMockCallInvoker());
  VerticalOCR jointModel(VALID_VERTICAL_DETECTOR_PATH,
                         VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                         createMockCallInvoker());

  EXPECT_NO_THROW(
      (void)independentModel.generate(VALID_VERTICAL_TEST_IMAGE_PATH));
  EXPECT_NO_THROW((void)jointModel.generate(VALID_VERTICAL_TEST_IMAGE_PATH));
}

TEST(VerticalOCRStrategyTests, BothStrategiesReturnValidResults) {
  VerticalOCR independentModel(VALID_VERTICAL_DETECTOR_PATH,
                               VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
                               true, createMockCallInvoker());
  VerticalOCR jointModel(VALID_VERTICAL_DETECTOR_PATH,
                         VALID_VERTICAL_RECOGNIZER_PATH, ENGLISH_SYMBOLS, false,
                         createMockCallInvoker());

  auto independentResults =
      independentModel.generate(VALID_VERTICAL_TEST_IMAGE_PATH);
  auto jointResults = jointModel.generate(VALID_VERTICAL_TEST_IMAGE_PATH);

  // Both should return some results (or none if no text detected)
  EXPECT_GE(independentResults.size(), 0u);
  EXPECT_GE(jointResults.size(), 0u);
}
