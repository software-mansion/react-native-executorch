#include <array>
#include <cmath>
#include <format>
#include <string>
#include <utility>
#include <vector>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using LlmOpsTest = JsiTestEnv;
using Case = std::pair<const char *, const char *>;

// `llm.sample` picks the next token from a `[1, vocab]` logits tensor. The
// TypeScript layer resolves every default before calling it, so the native side
// treats the core options as required and validates each one.
//
// The draw is random unless the options make it greedy, so the stochastic paths
// are checked over many draws against the set of tokens they are allowed to
// produce, never against a particular token. Note that `sample` rewrites the
// logits in place (constraints, penalties, DRY), so every draw refills them.

constexpr const char *kNs = R"(
    const sample = __rnexecutorch_jsi__.llm.sample;
    const createTensor = __rnexecutorch_jsi__.createTensor;
    const logits = (values) => {
        const t = createTensor([1, values.length], 'float32');
        t.setData(new Float32Array(values));
        return t;
    };
    const read = (t) => { const o = new Float32Array(t.numel); t.getData(o); return Array.from(o); };
    const ctx = (generated = []) => ({ generatedTokens: new Int32Array(generated) });
    // Options that leave the distribution untouched, so a test only states what it exercises.
    const neutral = (overrides = {}) => ({
        temperature: 1, topK: 1000, topP: 1, minP: 0, repetitionPenalty: 1, ...overrides,
    });
    const greedy = (overrides = {}) => neutral({ temperature: 0, ...overrides });
    // The distinct tokens `n` draws produce, sorted.
    const drawSet = (values, options, n = 300, generated = []) => {
        const seen = new Set();
        const t = createTensor([1, values.length], 'float32');
        for (let i = 0; i < n; i++) {
            t.setData(new Float32Array(values));
            seen.add(sample(t, ctx(generated), options));
        }
        return Array.from(seen).sort((a, b) => a - b);
    };
)";

std::string js(std::string_view body) { return std::format("{}\n{}", kNs, body); }

// --- Installation & arguments ------------------------------------------------

TEST_F(LlmOpsTest, IsInstalledUnderTheLlmNamespace) {
    EXPECT_EQ(evalString("return typeof __rnexecutorch_jsi__.llm.sample;"), "function");
}

TEST_F(LlmOpsTest, RejectsAWrongArgumentCount) {
    EXPECT_TRUE(isCodedError(evalThrowing(js("sample(logits([1, 2]), ctx());")),
                             "INVALID_ARGUMENT",
                             "Usage: sample(logits, ctx, options)"));
}

TEST_F(LlmOpsTest, RejectsLogitsOfTheWrongRank) {
    EXPECT_TRUE(isCodedError(evalThrowing(js(R"(
        const t = createTensor([4], 'float32');
        sample(t, ctx(), greedy());
    )")),
                             "INVALID_ARGUMENT",
                             "sample: logits"));
}

TEST_F(LlmOpsTest, RejectsABatchOfLogits) {
    // The runner decodes one sequence; a [2, vocab] tensor is a caller bug.
    EXPECT_TRUE(isCodedError(evalThrowing(js(R"(
        const t = createTensor([2, 4], 'float32');
        sample(t, ctx(), greedy());
    )")),
                             "INVALID_ARGUMENT",
                             "sample: logits"));
}

TEST_F(LlmOpsTest, RejectsNonFloatLogits) {
    EXPECT_TRUE(isCodedError(evalThrowing(js(R"(
        const t = createTensor([1, 4], 'int32');
        sample(t, ctx(), greedy());
    )")),
                             "INVALID_ARGUMENT",
                             "sample: logits"));
}

TEST_F(LlmOpsTest, RequiresEveryCoreOption) {
    for (const auto *option : {"temperature", "topK", "topP", "minP", "repetitionPenalty"}) {
        EXPECT_TRUE(isCodedError(evalThrowing(js(std::format(R"(
            const options = neutral();
            delete options.{};
            sample(logits([1, 2]), ctx(), options);
        )",
                                                             option))),
                                 "INVALID_ARGUMENT",
                                 option))
            << option;
    }
}

TEST_F(LlmOpsTest, ValidatesTheRangeOfEachCoreOption) {
    const std::array cases{
        Case{"topK: 0", "'topK' must be at least 1"},
        Case{"topP: 0", "'topP' must be in (0, 1]"},
        Case{"topP: 1.5", "'topP' must be in (0, 1]"},
        Case{"minP: -0.1", "'minP' must be in [0, 1)"},
        Case{"minP: 1", "'minP' must be in [0, 1)"},
        Case{"temperature: -1", "'temperature' must be non-negative"},
        Case{"repetitionPenalty: 0", "'repetitionPenalty' must be positive"},
    };
    for (const auto &[override, message] : cases) {
        EXPECT_TRUE(isCodedError(
            evalThrowing(js(std::format("sample(logits([1, 2]), ctx(), neutral({{ {} }}));", override))),
            "INVALID_ARGUMENT",
            message))
            << override;
    }
}

TEST_F(LlmOpsTest, ValidatesTheDryOptions) {
    const std::array cases{
        Case{"multiplier: -1", "'multiplier' must be non-negative"},
        Case{"base: 1", "'base' must be greater than 1.0"},
        Case{"allowedLength: -1", "'allowedLength' must be non-negative"},
        Case{"penaltyLastN: -2", "'penaltyLastN' must be -1 or non-negative"},
    };
    for (const auto &[override, message] : cases) {
        EXPECT_TRUE(isCodedError(evalThrowing(js(std::format(R"(
            const dry = {{
                multiplier: 1, base: 1.75, allowedLength: 2, penaltyLastN: -1,
                sequenceBreakers: new Int32Array(0), {}
            }};
            sample(logits([1, 2]), ctx([0, 1]), greedy({{ dry }}));
        )",
                                                             override))),
                                 "INVALID_ARGUMENT",
                                 message))
            << override;
    }
}

TEST_F(LlmOpsTest, ValidatesTheXtcOptions) {
    const std::array cases{
        Case{"probability: 1.5, threshold: 0.1", "'probability' must be in [0, 1]"},
        Case{"probability: 0.5, threshold: 0.6", "'threshold' must be in [0, 0.5]"},
    };
    for (const auto &[xtc, message] : cases) {
        EXPECT_TRUE(isCodedError(
            evalThrowing(js(std::format("sample(logits([1, 2]), ctx(), neutral({{ xtc: {{ {} }} }}));", xtc))),
            "INVALID_ARGUMENT",
            message))
            << xtc;
    }
}

// --- Greedy decoding ---------------------------------------------------------

TEST_F(LlmOpsTest, ZeroTemperatureReturnsTheArgmax) {
    EXPECT_EQ(evalNumber(js("return sample(logits([0.1, 3, -2, 2.9]), ctx(), greedy());")), 1);
}

TEST_F(LlmOpsTest, TopKOfOneReturnsTheArgmax) {
    EXPECT_EQ(evalNumber(js("return sample(logits([0.1, 3, -2, 2.9]), ctx(), neutral({ topK: 1 }));")), 1);
}

TEST_F(LlmOpsTest, GreedyDecodingIsDeterministic) {
    EXPECT_EQ(evalNumberArray(js("return drawSet([1, 1.01, 0.99], greedy(), 50);")), std::vector<double>{1});
}

TEST_F(LlmOpsTest, FailsWhenEveryLogitIsMasked) {
    // Greedy and sampled decoding take different paths to the same failure.
    for (const auto *options : {"greedy()", "neutral()"}) {
        EXPECT_TRUE(isCodedError(
            evalThrowing(js(std::format("sample(logits([-Infinity, -Infinity, NaN]), ctx(), {});", options))),
            "EXECUTION_FAILED",
            "No valid candidates"))
            << options;
    }
}

// --- Stochastic decoding -----------------------------------------------------

TEST_F(LlmOpsTest, SamplesAcrossComparableTokens) {
    // Two near-equal tokens: a greedy shortcut taken by mistake would only ever
    // return one of them.
    EXPECT_EQ(evalNumberArray(js("return drawSet([1, 1, -50], neutral());")), (std::vector<double>{0, 1}));
}

TEST_F(LlmOpsTest, TopKRestrictsTheDrawToTheKBestTokens) {
    EXPECT_EQ(evalNumberArray(js("return drawSet([1, 3, 2.9, 0.5, 2.8], neutral({ topK: 2 }));")),
              (std::vector<double>{1, 2}));
}

TEST_F(LlmOpsTest, DropsCandidatesFarBelowTheBest) {
    // Anything more than 16 logits under the best is pruned before softmax,
    // however wide top-k is.
    EXPECT_EQ(evalNumberArray(js("return drawSet([20, 3.9, 4.1], neutral({ temperature: 100 }));")),
              (std::vector<double>{0, 2}));
}

TEST_F(LlmOpsTest, TopPKeepsTheSmallestNucleusReachingP) {
    // Probabilities ~0.5, 0.3, 0.2: reaching 0.6 takes the first two tokens.
    EXPECT_EQ(evalNumberArray(
                  js("return drawSet([Math.log(0.5), Math.log(0.3), Math.log(0.2)], neutral({ topP: 0.6 }));")),
              (std::vector<double>{0, 1}));
}

TEST_F(LlmOpsTest, MinPDropsTokensFarLessLikelyThanTheBest) {
    // Probabilities ~0.5, 0.3, 0.2 with minP 0.5: only tokens at least half as
    // likely as the best survive.
    EXPECT_EQ(evalNumberArray(
                  js("return drawSet([Math.log(0.5), Math.log(0.3), Math.log(0.2)], neutral({ minP: 0.5 }));")),
              (std::vector<double>{0, 1}));
}

TEST_F(LlmOpsTest, LowTemperatureConcentratesOnTheBest) {
    EXPECT_EQ(evalNumberArray(js("return drawSet([1, 0.5, 0], neutral({ temperature: 0.01 }));")),
              std::vector<double>{0});
}

TEST_F(LlmOpsTest, XtcRemovesTheTopChoiceEvenWhenGreedy) {
    // Both tokens clear the threshold, so XTC drops the best one. That has to
    // happen before greedy selection, or XTC would be a no-op at temperature 0.
    EXPECT_EQ(evalNumberArray(js(R"(
        return drawSet([1, 0.9, -50], greedy({ xtc: { probability: 1, threshold: 0.1 } }), 50);
    )")),
              std::vector<double>{1});
    EXPECT_EQ(evalNumberArray(js(R"(
        return drawSet([1, 0.9, -50], greedy({ xtc: { probability: 0, threshold: 0.1 } }), 50);
    )")),
              std::vector<double>{0});
}

TEST_F(LlmOpsTest, XtcKeepsTheTopChoiceWhenItIsTheOnlyLikelyOne) {
    EXPECT_EQ(evalNumberArray(js(R"(
        return drawSet([10, 0, 0], greedy({ xtc: { probability: 1, threshold: 0.1 } }), 50);
    )")),
              std::vector<double>{0});
}

// --- Repetition penalty ------------------------------------------------------

TEST_F(LlmOpsTest, RepetitionPenaltyShrinksAPositiveRepeatedLogit) {
    // 2 / 1.5 = 1.33 falls below 1.9.
    EXPECT_EQ(evalNumber(js("return sample(logits([2, 1.9]), ctx([0]), greedy({ repetitionPenalty: 1.5 }));")),
              1);
}

TEST_F(LlmOpsTest, RepetitionPenaltyPushesANegativeRepeatedLogitFurtherDown) {
    // -1 * 1.5 = -1.5 falls below -1.2; dividing would have raised it instead.
    EXPECT_EQ(
        evalNumber(js("return sample(logits([-1, -1.2]), ctx([0]), greedy({ repetitionPenalty: 1.5 }));")),
        1);
}

TEST_F(LlmOpsTest, RepetitionPenaltyAppliesOncePerDistinctToken) {
    // Penalised once, 2 / 1.2 = 1.67 still beats 1.5; penalised for each of the
    // three occurrences it would not.
    EXPECT_EQ(
        evalNumber(js("return sample(logits([2, 1.5]), ctx([0, 0, 0]), greedy({ repetitionPenalty: 1.2 }));")),
        0);
}

TEST_F(LlmOpsTest, RepetitionPenaltyIgnoresOutOfRangeHistory) {
    EXPECT_EQ(
        evalNumber(js("return sample(logits([2, 1.9]), ctx([-1, 7]), greedy({ repetitionPenalty: 1.5 }));")),
        0);
}

// --- DRY ---------------------------------------------------------------------

// History 1 2 3 1 2: the suffix "1 2" already occurred, followed by 3, so
// emitting 3 now would repeat the sequence.
constexpr const char *kDry = R"(
    const dry = (overrides = {}) => ({
        multiplier: 2, base: 1.75, allowedLength: 2, penaltyLastN: -1,
        sequenceBreakers: new Int32Array(0), ...overrides,
    });
    const history = [1, 2, 3, 1, 2];
    const values = [0, 0, 0, 1];
)";

TEST_F(LlmOpsTest, DryPenalisesTheTokenThatWouldRepeatASequence) {
    EXPECT_EQ(evalNumber(js(std::format("{} return sample(logits(values), ctx(history), greedy());", kDry))), 3);
    EXPECT_EQ(evalNumber(js(std::format("{} return sample(logits(values), ctx(history), greedy({{ dry: dry() }}));",
                                        kDry))),
              0);
}

TEST_F(LlmOpsTest, DryToleratesRepeatsShorterThanTheAllowedLength) {
    EXPECT_EQ(evalNumber(js(std::format(
                  "{} return sample(logits(values), ctx(history), greedy({{ dry: dry({{ allowedLength: 3 }}) }}));",
                  kDry))),
              3);
}

TEST_F(LlmOpsTest, DryExemptsSequenceBreakers) {
    EXPECT_EQ(evalNumber(js(std::format(R"(
        {}
        const options = greedy({{ dry: dry({{ sequenceBreakers: new Int32Array([3]) }}) }});
        return sample(logits(values), ctx(history), options);
    )",
                                        kDry))),
              3);
}

TEST_F(LlmOpsTest, DryOnlyLooksAtTheLastNTokens) {
    // The earlier "1 2 3" falls outside a window of the last three tokens.
    EXPECT_EQ(evalNumber(js(std::format(
                  "{} return sample(logits(values), ctx(history), greedy({{ dry: dry({{ penaltyLastN: 3 }}) }}));",
                  kDry))),
              3);
}

// --- Constraints -------------------------------------------------------------

TEST_F(LlmOpsTest, AllowedTokensRestrictTheChoice) {
    EXPECT_EQ(evalNumber(js(R"(
        const constraints = () => ({ allowedTokens: new Int32Array([0, 2]) });
        return sample(logits([1, 5, 2]), ctx(), greedy({ constraints }));
    )")),
              2);
}

TEST_F(LlmOpsTest, BannedTokensAreNeverChosen) {
    EXPECT_EQ(evalNumberArray(js(R"(
        const constraints = () => ({ bannedTokens: new Int32Array([1]) });
        return drawSet([1, 5, 1], neutral({ constraints }));
    )")),
              (std::vector<double>{0, 2}));
}

TEST_F(LlmOpsTest, ConstraintsIgnoreOutOfRangeIds) {
    EXPECT_EQ(evalNumber(js(R"(
        const constraints = () => ({
            allowedTokens: new Int32Array([-1, 2, 99]),
            bannedTokens: new Int32Array([-5, 42]),
        });
        return sample(logits([1, 5, 2]), ctx(), greedy({ constraints }));
    )")),
              2);
}

TEST_F(LlmOpsTest, ConstraintsReturningNothingLeaveTheLogitsAlone) {
    for (const auto *ret : {"undefined", "null"}) {
        EXPECT_EQ(evalNumber(js(std::format(R"(
            const constraints = () => {{ return {}; }};
            return sample(logits([1, 5, 2]), ctx(), greedy({{ constraints }}));
        )",
                                            ret))),
                  1)
            << ret;
    }
}

TEST_F(LlmOpsTest, ConstraintsReceiveTheSamplingContext) {
    EXPECT_EQ(evalNumberArray(js(R"(
        let seen;
        const constraints = (c) => { seen = Array.from(c.generatedTokens); };
        sample(logits([1, 5, 2]), ctx([4, 2]), greedy({ constraints }));
        return seen;
    )")),
              (std::vector<double>{4, 2}));
}

TEST_F(LlmOpsTest, AnEmptyAllowListMasksEverything) {
    EXPECT_TRUE(isCodedError(evalThrowing(js(R"(
        const constraints = () => ({ allowedTokens: new Int32Array(0) });
        sample(logits([1, 5, 2]), ctx(), greedy({ constraints }));
    )")),
                             "EXECUTION_FAILED",
                             "No valid candidates"));
}

TEST_F(LlmOpsTest, PropagatesAThrowingConstraintsCallback) {
    EXPECT_THAT(evalThrowingMessage(js(R"(
        const constraints = () => { throw new Error('grammar exploded'); };
        sample(logits([1, 5, 2]), ctx(), greedy({ constraints }));
    )")),
                ::testing::HasSubstr("grammar exploded"));
}

// --- In-place effects --------------------------------------------------------

TEST_F(LlmOpsTest, RewritesTheLogitsInPlace) {
    // Documented on the TypeScript `sample`: the masked and penalised logits are
    // written back into the caller's tensor rather than a copy.
    auto result = evalNumberArray(js(R"(
        const t = logits([1, 2, 3]);
        const constraints = () => ({ bannedTokens: new Int32Array([2]) });
        sample(t, ctx([1]), greedy({ constraints, repetitionPenalty: 2 }));
        return read(t);
    )"));
    ASSERT_EQ(result.size(), 3u);
    EXPECT_DOUBLE_EQ(result[0], 1);
    EXPECT_DOUBLE_EQ(result[1], 1);
    EXPECT_TRUE(std::isinf(result[2]) && result[2] < 0);
}

} // namespace
} // namespace rnexecutorch::tests
