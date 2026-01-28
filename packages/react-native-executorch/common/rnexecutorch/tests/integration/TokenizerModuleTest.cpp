#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/TokenizerModule.h>

using namespace rnexecutorch;

constexpr auto kValidTokenizerPath = "tokenizer.json";

TEST(TokenizerCtorTests, InvalidPathThrows) {
  EXPECT_THROW(TokenizerModule("nonexistent_tokenizer.json", nullptr),
               RnExecutorchError);
}

TEST(TokenizerCtorTests, ValidPathDoesntThrow) {
  EXPECT_NO_THROW(TokenizerModule(kValidTokenizerPath, nullptr));
}

TEST(TokenizerMemoryTests, MemoryLowerBoundIsPositive) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  EXPECT_GT(tokenizer.getMemoryLowerBound(), 0u);
}

TEST(TokenizerEncodeTests, EmptyStringReturnsEmptyString) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto tokens = tokenizer.encode("");
  EXPECT_TRUE(tokens.empty());
}

TEST(TokenizerEncodeTests, SimpleTextReturnsTokens) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto tokens = tokenizer.encode("Hello world");
  EXPECT_GT(tokens.size(), 0u);
}

TEST(TokenizerEncodeTests, SameTextReturnsSameTokens) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto tokens1 = tokenizer.encode("test");
  auto tokens2 = tokenizer.encode("test");
  EXPECT_EQ(tokens1, tokens2);
}

TEST(TokenizerEncodeTests, DifferentTextReturnsDifferentTokens) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto tokens1 = tokenizer.encode("hello");
  auto tokens2 = tokenizer.encode("goodbye");
  EXPECT_NE(tokens1, tokens2);
}

TEST(TokenizerEncodeTests, SpecialCharactersWork) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto tokens = tokenizer.encode("!@#$%^&*()");
  EXPECT_GT(tokens.size(), 0u);
}

TEST(TokenizerEncodeTests, VeryLongTextWorks) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  std::string longText(10000, 'a');
  EXPECT_NO_THROW((void)tokenizer.encode(longText));
}

TEST(TokenizerDecodeTests, DecodeEncodedTextReturnsOriginal) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  std::string original = "szponcik";
  auto tokens = tokenizer.encode(original);
  auto decoded = tokenizer.decode(tokens, true);
  EXPECT_EQ(decoded, original);
}

TEST(TokenizerDecodeTests, DecodeEmptyVectorReturnsEmpty) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto decoded = tokenizer.decode({}, true);
  EXPECT_TRUE(decoded.empty());
}

TEST(TokenizerIdToTokenTests, ValidIdReturnsToken) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto token = tokenizer.idToToken(0);
  EXPECT_FALSE(token.empty());
}

TEST(TokenizerTokenToIdTests, RoundTripWorks) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto token = tokenizer.idToToken(100);
  auto id = tokenizer.tokenToId(token);
  EXPECT_EQ(id, 100);
}

TEST(TokenizerVocabTests, VocabSizeIsPositive) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  EXPECT_GT(tokenizer.getVocabSize(), 0u);
}

TEST(TokenizerVocabTests, VocabSizeIsReasonable) {
  TokenizerModule tokenizer(kValidTokenizerPath, nullptr);
  auto vocabSize = tokenizer.getVocabSize();
  EXPECT_GT(vocabSize, 1000u);
  EXPECT_LT(vocabSize, 1000000u);
}
