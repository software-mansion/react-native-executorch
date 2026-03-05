#include <gtest/gtest.h>
#include <map>
#include <memory>

#include <executorch/extension/module/module.h>
#include <rnexecutorch/Error.h>
#include <runner/encoders/vision_encoder.h>
#include <runner/multimodal_input.h>
#include <runner/multimodal_runner.h>

using ::executorch::extension::Module;
using ::executorch::extension::llm::VisionEncoder;
using ::executorch::runtime::Error;
using ::rnexecutorch::llm::runner::MultimodalType;

constexpr auto kTextModel = "smolLm2_135M_8da4w.pte";
constexpr auto kTextTokenizer = "smollm_tokenizer.json";
constexpr auto kVLMModel = "lfm2_5_vl_quantized_xnnpack_v2.pte";
constexpr auto kVLMTokenizer = "tokenizer_2.5.json";
constexpr auto kTestImage = "test_image.jpg";

static std::map<MultimodalType,
                std::unique_ptr<::executorch::extension::llm::IEncoder>>
makeVisionEncoders(Module *module) {
  std::map<MultimodalType,
           std::unique_ptr<::executorch::extension::llm::IEncoder>>
      encoders;
  encoders[MultimodalType::Image] = std::make_unique<VisionEncoder>(module);
  return encoders;
}

// ============================================================================
// Error-path tests (text-only SmolLM2 — no vision_encoder method)
// ============================================================================

TEST(MultimodalRunnerTest, LoadFailsWhenVisionEncoderMissing) {
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  auto encoders = makeVisionEncoders(module.get());
  rnexecutorch::llm::runner::MultimodalRunner runner(
      std::move(module), kTextTokenizer, std::move(encoders));
  EXPECT_THROW(runner.load(), rnexecutorch::RnExecutorchError);
}

TEST(MultimodalRunnerTest, IsLoadedReturnsFalseBeforeLoad) {
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  auto encoders = makeVisionEncoders(module.get());
  rnexecutorch::llm::runner::MultimodalRunner runner(
      std::move(module), kTextTokenizer, std::move(encoders));
  EXPECT_FALSE(runner.is_loaded());
}

// ============================================================================
// Integration tests (require VLM .pte)
// ============================================================================

class VLMTest : public ::testing::Test {
protected:
  std::unique_ptr<rnexecutorch::llm::runner::MultimodalRunner> runner_;

  void SetUp() override {
    auto module = std::make_unique<Module>(kVLMModel, Module::LoadMode::File);
    auto encoders = makeVisionEncoders(module.get());
    runner_ = std::make_unique<rnexecutorch::llm::runner::MultimodalRunner>(
        std::move(module), kVLMTokenizer, std::move(encoders));
    auto err = runner_->load();
    ASSERT_EQ(err, Error::Ok) << "VLM model load failed";
  }
};

TEST_F(VLMTest, LoadSucceedsWithRealVLMModel) {
  EXPECT_TRUE(runner_->is_loaded());
}

TEST_F(VLMTest, MetadataApplied_KVCache) {
  EXPECT_TRUE(runner_->config_.enable_kv_cache);
}

TEST_F(VLMTest, GenerateTextOnlyInputWorks) {
  runner_->set_temperature(0.0f);
  auto err = runner_->generate(
      "<|im_start|>user\nHello<|im_end|>\n<|im_start|>assistant\n");
  EXPECT_EQ(err, Error::Ok);
  EXPECT_GT(runner_->pos_, 0);
}

TEST_F(VLMTest, GenerateWithImageProducesTokens) {
  runner_->set_temperature(0.0f);

  std::vector<::executorch::extension::llm::MultimodalInput> inputs = {
      ::executorch::extension::llm::make_image_input(kTestImage),
      ::executorch::extension::llm::make_text_input(
          "<|im_start|>user\nDescribe this image briefly."
          "<|im_end|>\n<|im_start|>assistant\n"),
  };

  auto err = runner_->generate_internal(inputs, nullptr);
  EXPECT_EQ(err, Error::Ok);
  EXPECT_GT(runner_->pos_, 0);
}

TEST_F(VLMTest, EmbeddingCacheHitOnRepeatedImage) {
  runner_->set_temperature(0.0f);

  // First call — cache miss, runs vision_encoder
  std::vector<::executorch::extension::llm::MultimodalInput> inputs = {
      ::executorch::extension::llm::make_image_input(kTestImage),
      ::executorch::extension::llm::make_text_input(
          "<|im_start|>user\nWhat is this?<|im_end|>\n<|im_start|>assistant\n"),
  };
  runner_->generate_internal(inputs, nullptr);
  runner_->reset();

  // Second call — same image path, should hit cache
  // (no functional assertion possible without instrumenting the encoder,
  //  but this at least verifies it doesn't crash or error)
  auto err = runner_->generate_internal(inputs, nullptr);
  EXPECT_EQ(err, Error::Ok);
}
