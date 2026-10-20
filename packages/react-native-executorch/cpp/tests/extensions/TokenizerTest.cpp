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
        return ['encode', 'decode', 'tryDecode', 'getVocabSize', 'idToToken', 'tokenToId', 'dispose']
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

TEST_F(TokenizerTest, TryDecodeWaitsForCompleteUtf8BeforeCrossingJsi) {
    EXPECT_TRUE(evalBool(load(R"(
        // Whisper's ByteLevel vocabulary maps each byte to a token piece.
        function byteToken(byte) {
            const direct = (b) => (b >= 33 && b <= 126) ||
                (b >= 161 && b <= 172) || (b >= 174 && b <= 255);
            let codepoint = byte;
            if (!direct(byte)) {
                codepoint = 256;
                for (let b = 0; b < byte; b++) if (!direct(b)) codepoint++;
            }
            return t.tokenToId(String.fromCharCode(codepoint));
        }
        const cases = [
            [[0xc3, 0xa9], '\u00e9'],
            [[0xe0, 0xa4, 0x95], '\u0915'],
            [[0xf0, 0x9f, 0x98, 0x80], '\ud83d\ude00'],
        ];
        for (const [bytes, expected] of cases) {
            const ids = bytes.map(byteToken);
            for (let end = 1; end < ids.length; end++) {
                if (t.tryDecode(Int32Array.from(ids.slice(0, end))) !== undefined) return false;
                // A complete ASCII prefix must not hide an incomplete tail.
                if (t.tryDecode(Int32Array.from([byteToken(65), ...ids.slice(0, end)])) !== undefined)
                    return false;
            }
            if (t.tryDecode(Int32Array.from(ids)) !== expected) return false;
        }
        return t.tryDecode(new Int32Array(0)) === '' &&
            t.tryDecode(t.encode(' hello world')) === ' hello world';
    )")));
}

TEST_F(TokenizerTest, TryDecodePreservesSpecialTokenOptions) {
    EXPECT_TRUE(evalBool(load(R"(
        const ids = Int32Array.of(t.tokenToId('<|endoftext|>'));
        return t.tryDecode(ids) === '' &&
            t.tryDecode(ids, false) === '<|endoftext|>';
    )")));
}

TEST_F(TokenizerTest, TryDecodeReportsArgumentAndLifecycleErrors) {
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.tryDecode();")),
                             "INVALID_ARGUMENT", "Usage: tryDecode(tokens, skipSpecialTokens?)"));
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.tryDecode(new Int32Array(0), 42);")),
                             "INVALID_ARGUMENT", "tryDecode: skipSpecialTokens"));
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.tryDecode(Int32Array.of(t.getVocabSize() + 1000));")),
                             "EXECUTION_FAILED", "tryDecode:"));
    EXPECT_TRUE(isCodedError(evalThrowing(load("t.dispose(); t.tryDecode(new Int32Array(0));")),
                             "RESOURCE_DISPOSED", "tryDecode:"));
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
