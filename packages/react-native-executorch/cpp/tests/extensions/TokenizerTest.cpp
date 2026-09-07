#include <format>
#include <string>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using TokenizerTest = JsiTestEnv;
using ::testing::HasSubstr;

// The nlp extension wraps ExecuTorch's HFTokenizer. The fixture is Whisper
// tiny.en's tokenizer.json, a plain BPE vocabulary
// (scripts/fetch-test-fixtures.sh).
//
// What is under test is the JSI boundary, not the tokenizer itself: the typed
// array in and out, the id/piece lookups, and the disposal contract. Assertions
// avoid pinning particular token ids, which belong to the vocabulary rather than
// to this layer.

std::string load(const std::string &body) {
    return std::format(R"(
        const t = __rnexecutorch_jsi__.nlp.loadTokenizer('{}');
        {}
    )",
                       RNE_TOKENIZER_FIXTURE, body);
}

TEST_F(TokenizerTest, LoadsAHuggingFaceTokenizer) {
    EXPECT_TRUE(evalBool(load("return typeof t === 'object';")));
    EXPECT_TRUE(evalBool(load(R"(
        return ['encode', 'decode', 'getVocabSize', 'idToToken', 'tokenToId', 'dispose']
            .every((name) => typeof t[name] === 'function');
    )")));
}

TEST_F(TokenizerTest, ReportsTheVocabularySize) {
    auto size = evalNumber(load("return t.getVocabSize();"));
    EXPECT_GT(size, 0);
}

// encode returns an Int32Array, not a plain Array: the typed-array path is the
// one that crosses the worklet boundary with a single memcpy.
TEST_F(TokenizerTest, EncodesToAnInt32Array) {
    EXPECT_TRUE(evalBool(load("return t.encode('hello world') instanceof Int32Array;")));
    EXPECT_GT(evalNumber(load("return t.encode('hello world').length;")), 0);
}

TEST_F(TokenizerTest, RoundTripsText) {
    // Detokenisation of a BPE vocabulary is exact for plain ASCII words, so the
    // decoded text is compared directly rather than loosely.
    EXPECT_EQ(evalString(load("return t.decode(t.encode(' hello world'));")), " hello world");
}

TEST_F(TokenizerTest, EncodesTheEmptyStringToNothing) {
    EXPECT_EQ(evalNumber(load("return t.encode('').length;")), 0);
}

TEST_F(TokenizerTest, DecodesAnEmptyTokenListWithoutTouchingTheTokenizer) {
    EXPECT_EQ(evalString(load("return t.decode(new Int32Array(0));")), "");
}

TEST_F(TokenizerTest, ConvertsBetweenIdsAndPieces) {
    EXPECT_TRUE(evalBool(load(R"(
        const ids = t.encode('hello');
        const piece = t.idToToken(ids[0]);
        return typeof piece === 'string' && t.tokenToId(piece) === ids[0];
    )")));
}

TEST_F(TokenizerTest, ReportsUnknownPiecesAsExecutionFailures) {
    // A piece that is not in the vocabulary is a lookup failure inside the
    // tokenizer, not a malformed argument.
    auto thrown = evalThrowing(load("t.tokenToId('\\u0000not-a-real-piece\\u0000');"));
    EXPECT_TRUE(isCodedError(thrown, "EXECUTION_FAILED", "tokenToId:"));
}

TEST_F(TokenizerTest, ReportsOutOfRangeIdsAsExecutionFailures) {
    auto thrown = evalThrowing(load("t.idToToken(t.getVocabSize() + 1000);"));
    EXPECT_TRUE(isCodedError(thrown, "EXECUTION_FAILED", "idToToken:"));
}

TEST_F(TokenizerTest, ReportsAMissingFileAsLoadFailed) {
    auto thrown = evalThrowing("__rnexecutorch_jsi__.nlp.loadTokenizer('/no/such/tokenizer.json');");

    EXPECT_TRUE(isCodedError(thrown, "LOAD_FAILED", "/no/such/tokenizer.json"));
}

TEST_F(TokenizerTest, RejectsWrongArgumentTypes) {
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.encode(42);")),
                             "INVALID_ARGUMENT", "encode: text must be a string"));
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.tokenToId(1);")),
                             "INVALID_ARGUMENT", "tokenToId: token must be a string"));
}

TEST_F(TokenizerTest, RejectsWrongArgumentCounts) {
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.encode();")),
                             "INVALID_ARGUMENT", "Usage: encode(text)"));
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.getVocabSize(1);")),
                             "INVALID_ARGUMENT", "Usage: getVocabSize()"));
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.decode(t.encode('hi'), true, 'extra');")),
                             "INVALID_ARGUMENT", "Usage: decode(tokens, skipSpecialTokens?)"));
}

TEST_F(TokenizerTest, RejectsUseAfterDispose) {
    auto thrown = evalThrowing(load(R"(
        t.dispose();
        t.encode('hello');
    )"));
    EXPECT_TRUE(isCodedError(thrown, "RESOURCE_DISPOSED", "has been disposed"));
}

TEST_F(TokenizerTest, RejectsASecondDispose) {
    auto thrown = evalThrowing(load(R"(
        t.dispose();
        t.dispose();
    )"));
    EXPECT_TRUE(isCodedError(thrown, "RESOURCE_DISPOSED", "already been disposed"));
}

} // namespace
} // namespace rnexecutorch::tests
