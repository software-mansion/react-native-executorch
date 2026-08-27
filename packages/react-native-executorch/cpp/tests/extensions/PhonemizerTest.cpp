#include <string>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using PhonemizerTest = JsiTestEnv;
using ::testing::HasSubstr;

// createPhonemizer wraps phonemis, the G2P front end the Kokoro TTS pipeline
// feeds. Every language phonemizes through a lexicon with a neural fallback,
// and both of those are files under the submodule's `data/`, which lives in Git
// LFS and is not fetched here. So what these tests pin is the JSI contract —
// construction, argument checking, the lifecycle and how each failure is
// classified — while phonemize() returns an empty string because it has no
// vocabulary to work from. Actual phoneme output belongs with the on-device
// tests that run against the shipped assets.

TEST_F(PhonemizerTest, IsInstalledUnderTheSpeechNamespace) {
    EXPECT_EQ(evalString("return typeof __rnexecutorch_jsi__.speech.createPhonemizer;"), "function");
}

TEST_F(PhonemizerTest, AcceptsEverySupportedLanguage) {
    // The language string is passed straight through to phonemis, which picks
    // the pipeline from it. A profile it does not know throws (below), so this
    // is what catches a name drifting apart from the TS side.
    for (const auto *lang : {"en-us", "en-gb", "de", "fr", "es", "it", "pl", "pt", "hi"}) {
        EXPECT_TRUE(evalBool(std::string("__rnexecutorch_jsi__.speech.createPhonemizer({ lang: '") +
                             lang + "' }); return true;"))
            << "rejected language: " << lang;
    }
}

TEST_F(PhonemizerTest, ReturnsAStringForAnyInput) {
    // Without lexicon data the result is empty, but it must still come back as a
    // JS string: the bridge converts utf-8 to utf-32 and back, and a multi-byte
    // grapheme is where a naive std::string walk would corrupt the input.
    EXPECT_TRUE(evalBool(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        return typeof p.phonemize('kot') === 'string' && typeof p.phonemize('żółw') === 'string';
    )"));
}

TEST_F(PhonemizerTest, IsStableAcrossCalls) {
    EXPECT_TRUE(evalBool(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        return p.phonemize('dom') === p.phonemize('dom');
    )"));
}

TEST_F(PhonemizerTest, ExposesItsMethods) {
    EXPECT_TRUE(evalBool(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        return typeof p.phonemize === 'function' && typeof p.dispose === 'function';
    )"));
    // Unknown properties read as undefined rather than throwing, which is what
    // lets the TS layer feature-detect.
    EXPECT_TRUE(evalBool(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        return p.notAMethod === undefined;
    )"));
}

TEST_F(PhonemizerTest, RejectsAnUnsupportedLanguage) {
    auto thrown = evalThrowing(
        "__rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'xx-yy' });");

    // The failure comes out of phonemis as a std::exception, so this also covers
    // createPhonemizer classifying it rather than letting it reach JS as UNKNOWN.
    EXPECT_TRUE(isCodedError(thrown, "LOAD_FAILED", "createPhonemizer:"));
    EXPECT_THAT(thrown.message, HasSubstr("xx-yy"));
}

TEST_F(PhonemizerTest, RequiresALanguage) {
    auto thrown = evalThrowing("__rnexecutorch_jsi__.speech.createPhonemizer({});");

    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "option 'lang' is required"));
}

TEST_F(PhonemizerTest, RejectsWrongArgumentCounts) {
    EXPECT_TRUE(isCodedError(evalThrowing("__rnexecutorch_jsi__.speech.createPhonemizer();"),
                             "INVALID_ARGUMENT", "Usage: createPhonemizer(config)"));
    EXPECT_TRUE(isCodedError(evalThrowing("__rnexecutorch_jsi__.speech.createPhonemizer('pl');"),
                             "INVALID_ARGUMENT", "config must be an object"));
}

TEST_F(PhonemizerTest, RejectsWrongArgumentCountsOnPhonemize) {
    auto thrown = evalThrowing(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        p.phonemize();
    )");
    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "Usage: phonemize(text)"));
}

TEST_F(PhonemizerTest, RejectsNonStringText) {
    auto thrown = evalThrowing(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        p.phonemize(42);
    )");
    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "phonemize: text must be a string"));
}

// dispose frees the pipeline eagerly rather than waiting for GC, so using the
// object afterwards has to be reported rather than crashing.
TEST_F(PhonemizerTest, RejectsUseAfterDispose) {
    auto thrown = evalThrowing(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        p.dispose();
        p.phonemize('kot');
    )");
    EXPECT_TRUE(isCodedError(thrown, "RESOURCE_DISPOSED", "has been disposed"));
}

TEST_F(PhonemizerTest, DisposeIsIdempotent) {
    EXPECT_TRUE(evalBool(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({ lang: 'pl' });
        p.dispose();
        p.dispose();
        return true;
    )"));
}

} // namespace
} // namespace rnexecutorch::tests
