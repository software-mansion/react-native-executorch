#include "../integration/stubs/StubRunner.h"
#include <gtest/gtest.h>
#include <runner/irunner.h>
#include <runner/multimodal_input.h>

using namespace executorch::extension::llm;

// ============================================================================
// resolve_max_new_tokens tests
// ============================================================================

class ResolveMaxNewTokensTest : public ::testing::Test {
protected:
  StubRunner runner{nullptr, "dummy"};
};

TEST_F(ResolveMaxNewTokensTest, BothMinusOne_UsesContextMinusPrompt) {
  EXPECT_EQ(runner.resolve_max(10, -1, 128, -1), 118);
}

TEST_F(ResolveMaxNewTokensTest, OnlySeqLenMinusOne_CapsAtMaxNew) {
  EXPECT_EQ(runner.resolve_max(10, -1, 128, 50), 50);
  EXPECT_EQ(runner.resolve_max(10, -1, 128, 200), 118);
}

TEST_F(ResolveMaxNewTokensTest, OnlyMaxNewMinusOne_CapsAtSeqLen) {
  EXPECT_EQ(runner.resolve_max(10, 64, 128, -1), 54);
  EXPECT_EQ(runner.resolve_max(10, 200, 128, -1), 118);
}

TEST_F(ResolveMaxNewTokensTest, NeitherMinusOne_TakesSmallest) {
  EXPECT_EQ(runner.resolve_max(10, 64, 128, 30), 30);
  EXPECT_EQ(runner.resolve_max(10, 64, 128, 100), 54);
}

TEST_F(ResolveMaxNewTokensTest, ClampedToZeroWhenPromptExceedsContext) {
  EXPECT_EQ(runner.resolve_max(200, -1, 128, -1), 0);
  EXPECT_EQ(runner.resolve_max(200, 64, 128, -1), 0);
}

// ============================================================================
// MultimodalInput edge cases
// ============================================================================

TEST(MultimodalInputTest, GetTextOnImageThrows) {
  auto input = make_image_input("/some/path.jpg");
  EXPECT_THROW(input.get_text(), std::bad_variant_access);
}

TEST(MultimodalInputTest, GetImagePathOnTextThrows) {
  MultimodalInput input(std::string("hello"));
  EXPECT_THROW(input.get_image_path(), std::bad_variant_access);
}

TEST(MultimodalInputTest, EmptyStringIsStillText) {
  MultimodalInput input(std::string(""));
  EXPECT_TRUE(input.is_text());
  EXPECT_EQ(input.get_text(), "");
}

// ============================================================================
// BaseLLMRunner via StubRunner
// ============================================================================

TEST(BaseLLMRunnerTest, SetTemperatureUpdatesConfig) {
  StubRunner runner(nullptr, "dummy");
  runner.set_temperature(0.42f);
  EXPECT_FLOAT_EQ(runner.config_.temperature, 0.42f);
}

TEST(BaseLLMRunnerTest, SetToppUpdatesConfig) {
  StubRunner runner(nullptr, "dummy");
  runner.set_topp(0.7f);
  EXPECT_FLOAT_EQ(runner.config_.topp, 0.7f);
}

TEST(BaseLLMRunnerTest, ResetZerosPosAndStats) {
  StubRunner runner(nullptr, "dummy");
  runner.pos_ = 99;
  runner.stats_.num_generated_tokens = 5;
  runner.reset();
  EXPECT_EQ(runner.pos_, 0);
  EXPECT_EQ(runner.stats_.num_generated_tokens, 0);
}

TEST(BaseLLMRunnerTest, GenerateEmptyStringReturnsError) {
  StubRunner runner(nullptr, "dummy");
  auto err = runner.generate("", {}, {}, {});
  EXPECT_NE(err, ::executorch::runtime::Error::Ok);
}

TEST(BaseLLMRunnerTest, SetMinPUpdatesConfig) {
  StubRunner runner(nullptr, "dummy");
  runner.set_min_p(0.15f);
  EXPECT_FLOAT_EQ(runner.config_.min_p, 0.15f);
}

TEST(BaseLLMRunnerTest, SetRepetitionPenaltyUpdatesConfig) {
  StubRunner runner(nullptr, "dummy");
  runner.set_repetition_penalty(1.05f);
  EXPECT_FLOAT_EQ(runner.config_.repetition_penalty, 1.05f);
}
