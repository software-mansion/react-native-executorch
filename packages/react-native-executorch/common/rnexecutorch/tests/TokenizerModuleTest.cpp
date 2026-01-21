#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/TokenizerModule.h>
#include <string>
#include <vector>

using namespace rnexecutorch;

constexpr auto VALID_TOKENIZER_PATH = "tokenizer.json";

TEST(TokenizerCtorTests, InvalidPathThrows) {
  EXPECT_THROW(TokenizerModule("nonexistent_tokenizer.json", nullptr),
               RnExecutorchError);
}

TEST(TokenizerCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(TokenizerModule(VALID_TOKENIZER_PATH, nullptr));
}

TEST(TokenizerEncodeTests, EmptyStringReturnsEmptyString) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto tokens = tokenizer.encode("");
  EXPECT_TRUE(tokens.empty());
}

TEST(TokenizerEncodeTests, SimpleTextReturnsTokens) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto tokens = tokenizer.encode("Hello world");
  EXPECT_GT(tokens.size(), 0u);
}

TEST(TokenizerEncodeTests, SameTextReturnsSameTokens) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto tokens1 = tokenizer.encode("test");
  auto tokens2 = tokenizer.encode("test");
  EXPECT_EQ(tokens1, tokens2);
}

TEST(TokenizerEncodeTests, DifferentTextReturnsDifferentTokens) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto tokens1 = tokenizer.encode("hello");
  auto tokens2 = tokenizer.encode("goodbye");
  EXPECT_NE(tokens1, tokens2);
}

TEST(TokenizerDecodeTests, DecodeEncodedTextReturnsOriginal) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  std::string original = "szponcik";
  auto tokens = tokenizer.encode(original);
  auto decoded = tokenizer.decode(tokens, true);
  EXPECT_EQ(decoded, original);
}

TEST(TokenizerDecodeTests, DecodeEmptyVectorReturnsEmpty) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto decoded = tokenizer.decode({}, true);
  EXPECT_TRUE(decoded.empty());
}

TEST(TokenizerIdToTokenTests, ValidIdReturnsToken) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto token = tokenizer.idToToken(0);
  EXPECT_FALSE(token.empty());
}

TEST(TokenizerTokenToIdTests, RoundTripWorks) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto token = tokenizer.idToToken(100);
  auto id = tokenizer.tokenToId(token);
  EXPECT_EQ(id, 100);
}

TEST(TokenizerVocabTests, VocabSizeIsPositive) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  EXPECT_GT(tokenizer.getVocabSize(), 0u);
}

TEST(TokenizerVocabTests, VocabSizeIsReasonable) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  auto vocabSize = tokenizer.getVocabSize();
  EXPECT_GT(vocabSize, 1000u);
  EXPECT_LT(vocabSize, 1000000u);
}

TEST(TokenizerMemoryTests, MemoryLowerBoundIsPositive) {
  TokenizerModule tokenizer(VALID_TOKENIZER_PATH, nullptr);
  EXPECT_GT(tokenizer.getMemoryLowerBound(), 0u);
}
