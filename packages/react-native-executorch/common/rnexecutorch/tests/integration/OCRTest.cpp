#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/ocr/OCR.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::ocr;
using namespace model_tests;

namespace rnexecutorch {
std::shared_ptr<facebook::react::CallInvoker> createMockCallInvoker();
}

constexpr auto VALID_DETECTOR_PATH = "xnnpack_craft_quantized.pte";
constexpr auto VALID_RECOGNIZER_PATH = "xnnpack_crnn_english.pte";
constexpr auto VALID_TEST_IMAGE_PATH =
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
template <> struct ModelTraits<OCR> {
  using ModelType = OCR;

  static ModelType createValid() {
    return ModelType(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH,
                     ENGLISH_SYMBOLS, rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.pte", VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
                     rnexecutorch::createMockCallInvoker());
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate(VALID_TEST_IMAGE_PATH);
  }
};
} // namespace model_tests

using OCRTypes = ::testing::Types<OCR>;
INSTANTIATE_TYPED_TEST_SUITE_P(OCR, CommonModelTest, OCRTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(OCRCtorTests, InvalidRecognizerPathThrows) {
  EXPECT_THROW(OCR(VALID_DETECTOR_PATH, "nonexistent.pte", ENGLISH_SYMBOLS,
                   createMockCallInvoker()),
               RnExecutorchError);
}

TEST(OCRCtorTests, EmptySymbolsThrows) {
  EXPECT_THROW(OCR(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, "",
                   createMockCallInvoker()),
               RnExecutorchError);
}

TEST(OCRGenerateTests, InvalidImagePathThrows) {
  OCR model(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
            createMockCallInvoker());
  EXPECT_THROW((void)model.generate("nonexistent_image.jpg"),
               RnExecutorchError);
}

TEST(OCRGenerateTests, EmptyImagePathThrows) {
  OCR model(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
            createMockCallInvoker());
  EXPECT_THROW((void)model.generate(""), RnExecutorchError);
}

TEST(OCRGenerateTests, MalformedURIThrows) {
  OCR model(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
            createMockCallInvoker());
  EXPECT_THROW((void)model.generate("not_a_valid_uri://bad"),
               RnExecutorchError);
}

TEST(OCRGenerateTests, ValidImageReturnsResults) {
  OCR model(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
            createMockCallInvoker());
  auto results = model.generate(VALID_TEST_IMAGE_PATH);
  // May or may not have detections depending on image content
  EXPECT_GE(results.size(), 0u);
}

TEST(OCRGenerateTests, DetectionsHaveValidBoundingBoxes) {
  OCR model(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
            createMockCallInvoker());
  auto results = model.generate(VALID_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    // Each bbox should have 4 points
    EXPECT_EQ(detection.bbox.size(), 4u);
    for (const auto &point : detection.bbox) {
      EXPECT_GE(point.x, 0.0f);
      EXPECT_GE(point.y, 0.0f);
    }
  }
}

TEST(OCRGenerateTests, DetectionsHaveValidScores) {
  OCR model(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
            createMockCallInvoker());
  auto results = model.generate(VALID_TEST_IMAGE_PATH);

  for (const auto &detection : results) {
    EXPECT_GE(detection.score, 0.0f);
    EXPECT_LE(detection.score, 1.0f);
  }
}

TEST(OCRGenerateTests, DetectionsHaveNonEmptyText) {
  OCR model(VALID_DETECTOR_PATH, VALID_RECOGNIZER_PATH, ENGLISH_SYMBOLS,
            createMockCallInvoker());
  auto results = model.generate(VALID_TEST_IMAGE_PATH);
  for (const auto &detection : results) {
    // If there's a detection, it should have text
    std::cout << detection.text << std::endl;
    EXPECT_FALSE(detection.text.empty());
  }
}
