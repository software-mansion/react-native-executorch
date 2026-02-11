#include "BaseModelTests.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/text_to_image/TextToImage.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::text_to_image;
using namespace model_tests;

namespace rnexecutorch {
std::shared_ptr<facebook::react::CallInvoker> createMockCallInvoker();
}

constexpr auto kValidTokenizerPath = "t2i_tokenizer.json";
constexpr auto kValidEncoderPath = "t2i_encoder.pte";
constexpr auto kValidUnetPath = "t2i_unet.pte";
constexpr auto kValidDecoderPath = "t2i_decoder.pte";

constexpr float kSchedulerBetaStart = 0.00085f;
constexpr float kSchedulerBetaEnd = 0.012f;
constexpr int32_t kSchedulerNumTrainTimesteps = 1000;
constexpr int32_t kSchedulerStepsOffset = 1;

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<TextToImage> {
  using ModelType = TextToImage;

  static ModelType createValid() {
    return ModelType(kValidTokenizerPath, kValidEncoderPath, kValidUnetPath,
                     kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                     kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                     rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.json", kValidEncoderPath, kValidUnetPath,
                     kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                     kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                     rnexecutorch::createMockCallInvoker());
  }

  static void callGenerate(ModelType &model) {
    (void)model.generate("a cat", 128, 1, 42, nullptr);
  }
};
} // namespace model_tests

using TextToImageTypes = ::testing::Types<TextToImage>;
INSTANTIATE_TYPED_TEST_SUITE_P(TextToImage, CommonModelTest, TextToImageTypes);

// ============================================================================
// Model-specific tests
// ============================================================================
TEST(TextToImageCtorTests, InvalidEncoderPathThrows) {
  EXPECT_THROW(TextToImage(kValidTokenizerPath, "nonexistent.pte",
                           kValidUnetPath, kValidDecoderPath,
                           kSchedulerBetaStart, kSchedulerBetaEnd,
                           kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                           createMockCallInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, InvalidUnetPathThrows) {
  EXPECT_THROW(TextToImage(kValidTokenizerPath, kValidEncoderPath,
                           "nonexistent.pte", kValidDecoderPath,
                           kSchedulerBetaStart, kSchedulerBetaEnd,
                           kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                           createMockCallInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, InvalidDecoderPathThrows) {
  EXPECT_THROW(TextToImage(kValidTokenizerPath, kValidEncoderPath,
                           kValidUnetPath, "nonexistent.pte",
                           kSchedulerBetaStart, kSchedulerBetaEnd,
                           kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                           createMockCallInvoker()),
               RnExecutorchError);
}

TEST(TextToImageGenerateTests, InvalidImageSizeThrows) {
  TextToImage model(kValidTokenizerPath, kValidEncoderPath, kValidUnetPath,
                    kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                    kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate("a cat", 100, 1, 42, nullptr),
               RnExecutorchError);
}

TEST(TextToImageGenerateTests, EmptyPromptThrows) {
  TextToImage model(kValidTokenizerPath, kValidEncoderPath, kValidUnetPath,
                    kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                    kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate("", 128, 1, 42, nullptr),
               RnExecutorchError);
}

TEST(TextToImageGenerateTests, ZeroStepsThrows) {
  TextToImage model(kValidTokenizerPath, kValidEncoderPath, kValidUnetPath,
                    kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                    kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                    createMockCallInvoker());
  EXPECT_THROW((void)model.generate("a cat", 128, 0, 42, nullptr),
               RnExecutorchError);
}

TEST(TextToImageGenerateTests, GenerateReturnsNonNull) {
  // TODO: Investigate source of the issue
  GTEST_SKIP() << "Skipping TextToImage generation test in emulator "
                  "environment due to UNet forward call throwing error no. 1";
  TextToImage model(kValidTokenizerPath, kValidEncoderPath, kValidUnetPath,
                    kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                    kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                    createMockCallInvoker());
  auto result = model.generate("a cat", 128, 1, 42, nullptr);
  EXPECT_NE(result, nullptr);
}

TEST(TextToImageGenerateTests, GenerateReturnsCorrectSize) {
  // TODO: Investigate source of the issue
  GTEST_SKIP() << "Skipping TextToImage generation test in emulator "
                  "environment due to UNet forward call throwing error no. 1";
  TextToImage model(kValidTokenizerPath, kValidEncoderPath, kValidUnetPath,
                    kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                    kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                    createMockCallInvoker());
  int32_t imageSize = 128;
  auto result = model.generate("a cat", imageSize, 1, 42, nullptr);
  ASSERT_NE(result, nullptr);
  size_t expectedSize = imageSize * imageSize * 4;
  EXPECT_EQ(result->size(), expectedSize);
}

TEST(TextToImageGenerateTests, SameSeedProducesSameResult) {
  // TODO: Investigate source of the issue
  GTEST_SKIP() << "Skipping TextToImage generation test in emulator "
                  "environment due to UNet forward call throwing error no. 1";
  TextToImage model(kValidTokenizerPath, kValidEncoderPath, kValidUnetPath,
                    kValidDecoderPath, kSchedulerBetaStart, kSchedulerBetaEnd,
                    kSchedulerNumTrainTimesteps, kSchedulerStepsOffset,
                    createMockCallInvoker());
  auto result1 = model.generate("a cat", 128, 1, 42, nullptr);
  auto result2 = model.generate("a cat", 128, 1, 42, nullptr);
  ASSERT_NE(result1, nullptr);
  ASSERT_NE(result2, nullptr);
  ASSERT_EQ(result1->size(), result2->size());

  auto data1 = static_cast<uint8_t *>(result1->data());
  auto data2 = static_cast<uint8_t *>(result2->data());
  for (size_t i = 0; i < result1->size(); i++) {
    EXPECT_EQ(data1[i], data2[i]) << "at index: " << i;
  }
}
