#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/text_to_image/TextToImage.h>
#include <string>

using namespace rnexecutorch;
using namespace rnexecutorch::models::text_to_image;

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

static auto getMockInvoker() { return createMockCallInvoker(); }

TEST(TextToImageCtorTests, InvalidTokenizerPathThrows) {
  EXPECT_THROW(TextToImage("nonexistent.json", VALID_ENCODER_PATH,
                           VALID_UNET_PATH, VALID_DECODER_PATH,
                           SCHEDULER_BETA_START, SCHEDULER_BETA_END,
                           SCHEDULER_NUM_TRAIN_TIMESTEPS,
                           SCHEDULER_STEPS_OFFSET, getMockInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, InvalidEncoderPathThrows) {
  EXPECT_THROW(TextToImage(VALID_TOKENIZER_PATH, "nonexistent.pte",
                           VALID_UNET_PATH, VALID_DECODER_PATH,
                           SCHEDULER_BETA_START, SCHEDULER_BETA_END,
                           SCHEDULER_NUM_TRAIN_TIMESTEPS,
                           SCHEDULER_STEPS_OFFSET, getMockInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, InvalidUnetPathThrows) {
  EXPECT_THROW(TextToImage(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH,
                           "nonexistent.pte", VALID_DECODER_PATH,
                           SCHEDULER_BETA_START, SCHEDULER_BETA_END,
                           SCHEDULER_NUM_TRAIN_TIMESTEPS,
                           SCHEDULER_STEPS_OFFSET, getMockInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, InvalidDecoderPathThrows) {
  EXPECT_THROW(TextToImage(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH,
                           VALID_UNET_PATH, "nonexistent.pte",
                           SCHEDULER_BETA_START, SCHEDULER_BETA_END,
                           SCHEDULER_NUM_TRAIN_TIMESTEPS,
                           SCHEDULER_STEPS_OFFSET, getMockInvoker()),
               RnExecutorchError);
}

TEST(TextToImageCtorTests, ValidPathsDoesntThrow) {
  EXPECT_NO_THROW(TextToImage(
      VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
      VALID_DECODER_PATH, SCHEDULER_BETA_START, SCHEDULER_BETA_END,
      SCHEDULER_NUM_TRAIN_TIMESTEPS, SCHEDULER_STEPS_OFFSET, getMockInvoker()));
}

TEST(TextToImageMemoryTests, GetMemoryLowerBoundReturnsPositive) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, getMockInvoker());
  EXPECT_GT(model.getMemoryLowerBound(), 0u);
}

TEST(TextToImageUnloadTests, UnloadDoesntThrow) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, getMockInvoker());
  EXPECT_NO_THROW(model.unload());
}

TEST(TextToImageGenerateTests, InvalidImageSizeThrows) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, getMockInvoker());
  // Image size must be multiple of 32
  EXPECT_THROW((void)model.generate("a cat", 100, 1, 42, nullptr),
               RnExecutorchError);
}

TEST(TextToImageGenerateTests, GenerateReturnsNonNull) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, getMockInvoker());
  // Use minimal settings: 128x128 image, 1 inference step
  auto result = model.generate("a cat", 128, 1, 42, nullptr);
  EXPECT_NE(result, nullptr);
}

TEST(TextToImageGenerateTests, GenerateReturnsCorrectSize) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, getMockInvoker());
  int32_t imageSize = 128;
  auto result = model.generate("a cat", imageSize, 1, 42, nullptr);
  ASSERT_NE(result, nullptr);
  // Output is RGBA, so 4 bytes per pixel
  size_t expectedSize = imageSize * imageSize * 4;
  EXPECT_EQ(result->size(), expectedSize);
}

TEST(TextToImageGenerateTests, SameSeedProducesSameResult) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, getMockInvoker());
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

TEST(TextToImageInterruptTests, InterruptDoesntThrow) {
  TextToImage model(VALID_TOKENIZER_PATH, VALID_ENCODER_PATH, VALID_UNET_PATH,
                    VALID_DECODER_PATH, SCHEDULER_BETA_START,
                    SCHEDULER_BETA_END, SCHEDULER_NUM_TRAIN_TIMESTEPS,
                    SCHEDULER_STEPS_OFFSET, getMockInvoker());
  EXPECT_NO_THROW(model.interrupt());
}
