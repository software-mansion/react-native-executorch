#include <gtest/gtest.h>
#include <memory>

#include <executorch/extension/module/module.h>
#include <rnexecutorch/Error.h>
#include <runner/text_runner.h>

using ::executorch::extension::Module;
using ::executorch::runtime::Error;

constexpr auto kTextModel = "smolLm2_135M_8da4w.pte";
constexpr auto kTextTokenizer = "smollm_tokenizer.json";
constexpr auto kSystemPrompt = "You are a helpful assistant. Assist the user "
                               "to the best of your abilities.";

static std::string formatChatML(const std::string &systemPrompt,
                                const std::string &userMessage) {
  return "<|im_start|>system\n" + systemPrompt + "<|im_end|>\n" +
         "<|im_start|>user\n" + userMessage + "<|im_end|>\n" +
         "<|im_start|>assistant\n";
}

TEST(TextRunnerTest, ConstructorAndLoadSucceeds) {
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  auto err = runner.load();
  EXPECT_EQ(err, Error::Ok);
  EXPECT_TRUE(runner.is_loaded());
}

TEST(TextRunnerTest, MetadataApplied_EnableDynamicShape) {
  // SmolLM2-135M exports enable_dynamic_shape = 1
  // After load(), config_.enable_dynamic_shape must be true (our fix)
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  runner.load();
  EXPECT_TRUE(runner.config_.enable_dynamic_shape);
}

TEST(TextRunnerTest, MetadataApplied_KVCache) {
  // SmolLM2-135M exports use_kv_cache = 1
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  runner.load();
  EXPECT_TRUE(runner.config_.enable_kv_cache);
}

TEST(TextRunnerTest, SetTemperaturePropagatesAfterLoad) {
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  runner.load();
  runner.set_temperature(0.3f);
  EXPECT_FLOAT_EQ(runner.config_.temperature, 0.3f);
}

TEST(TextRunnerTest, ResetZerosPos) {
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  runner.pos_ = 42;
  runner.reset();
  EXPECT_EQ(runner.pos_, 0);
}

TEST(TextRunnerTest, GenerateProducesTokens) {
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  runner.load();
  runner.set_temperature(0.0f);

  std::string prompt = formatChatML(kSystemPrompt, "Say: hello");
  auto err = runner.generate(prompt);
  EXPECT_EQ(err, Error::Ok);
  EXPECT_GT(runner.pos_, 0);
}

TEST(TextRunnerTest, ParallelPrefillEnabled) {
  // Confirms the fix: enable_dynamic_shape from metadata now unconditionally
  // applied
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  runner.load();
  EXPECT_TRUE(runner.config_.enable_dynamic_shape);
}

TEST(TextRunnerTest, StopHaltsGeneration) {
  auto module = std::make_unique<Module>(kTextModel, Module::LoadMode::File);
  rnexecutorch::llm::runner::TextRunner runner(std::move(module),
                                               kTextTokenizer);
  runner.load();
  runner.set_temperature(0.0f);

  int token_count = 0;
  std::string prompt = formatChatML(kSystemPrompt, "Count to one hundred");
  runner.generate(prompt, {}, [&](const std::string &) {
    token_count++;
    if (token_count >= 3) {
      runner.stop();
    }
  });
  EXPECT_GT(token_count, 0);
  EXPECT_LE(token_count, 5); // stopped early
}
