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

constexpr auto VALID_TOKENIZER_PATH = "t2i_tokenizer.json";
constexpr auto VALID_ENCODER_PATH = "t2i_encoder.pte";
constexpr auto VALID_UNET_PATH = "t2i_unet.pte";
constexpr auto VALID_DECODER_PATH = "t2i_decoder.pte";

constexpr float SCHEDULER_BETA_START = 0.00085f;
constexpr float SCHEDULER_BETA_END = 0.012f;
constexpr int32_t SCHEDULER_NUM_TRAIN_TIMESTEPS = 1000;
constexpr int32_t SCHEDULER_STEPS_OFFSET = 1;

// ============================================================================
// Common tests via typed test suite
// ============================================================================
namespace model_tests {
template <> struct ModelTraits<TextToImage> {
  using ModelType = TextToImage;

  static ModelType createValid() {
    return ModelType(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                     VALID_DECODER_PATH, SCHEDULER_BETA_START,
                     SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                     SCHEDULER_STEPS_OFFSET,
                     rnexecutorch::createMockCallInvoker());
  }

  static ModelType createInvalid() {
    return ModelType("nonexistent.json", VALID_ENCODER_PATH, VALID_UNET_PATH,
                     VALID_DECODER_PATH, SCHEDULER_BETA_START,
                     SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                     SCHEDULER_STEPS_OFFSET,
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
  EXPECT_THROW(TextToImage(VALID_TOKENIZER_PATH, "nonexistent.pte",
                           VALID_UNET_PATH, VALID_DECODER_PATH,
                           SCHEDULER_BETA_START, SCHEDULER_BETA_END,
                           SCHEDULER_NUM_TRAIN_TIMESTEPS,
                           SCHEDULER_STEPS_OFFSET, createMockCallInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, InvalidUnetPathThrows) {
  EXPECT_THROW(TextToImage(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH,
                           "nonexistent.pte", VALID_DECODER_PATH,
                           SCHEDULER_BETA_START, SCHEDULER_BETA_END,
                           SCHEDULER_NUM_TRAIN_TIMESTEPS,
                           SCHEDULER_STEPS_OFFSET, createMockCallInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, InvalidDecoderPathThrows) {
  EXPECT_THROW(TextToImage(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH,
                           VALID_UNET_PATH, "nonexistent.pte",
                           SCHEDULER_BETA_START, SCHEDULER_BETA_END,
                           SCHEDULER_NUM_TRAIN_TIMESTEPS,
                           SCHEDULER_STEPS_OFFSET, createMockCallInvoker()),
               RnExecutorchError);
}

TEST(TextToImageGenerateTests, InvalidImageSizeThrows) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, createMockCallInvoker());
  EXPECT_THROW((void)model.generate("a cat", 100, 1, 42, nullptr),
               RnExecutorchError);
}

TEST(TextToImageGenerateTests, GenerateReturnsNonNull) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, createMockCallInvoker());
  auto result = model.generate("a cat", 128, 1, 42, nullptr);
  EXPECT_NE(result, nullptr);
}

TEST(TextToImageGenerateTests, GenerateReturnsCorrectSize) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, createMockCallInvoker());
  int32_t imageSize = 128;
  auto result = model.generate("a cat", imageSize, 1, 42, nullptr);
  ASSERT_NE(result, nullptr);
  size_t expectedSize = imageSize * imageSize * 4;
  EXPECT_EQ(result->size(), expectedSize);
}

TEST(TextToImageGenerateTests, SameSeedProducesSameResult) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, createMockCallInvoker());
  auto result1 = model.generate("a cat", 128, 1, 42, nullptr);
  auto result2 = model.generate("a cat", 128, 1, 42, nullptr);
  ASSERT_NE(result1, nullptr);
  ASSERT_NE(result2, nullptr);
  ASSERT_EQ(result1->size(), result2->size());

  auto data1 = static_cast<uint8_t *>(result1->data());
  auto data2 = static_cast<uint8_t *>(result2->data());
  bool same = true;
  for (size_t i = 0; i < result1->size(); i++) {
    if (data1[i] != data2[i]) {
      same = false;
      break;
    }
  }
  EXPECT_TRUE(same);
}
