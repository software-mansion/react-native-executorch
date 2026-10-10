#include "sampler.h"

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <iterator>
#include <limits>
#include <optional>
#include <random>
#include <span>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

#include "core/conversions.h"
#include "core/error.h"
#include "core/tensor.h"
#include "core/tensor_helpers.h"

namespace rnexecutorch::extensions::llm {
namespace jsi = facebook::jsi;
namespace error = rnexecutorch::core::error;
namespace tensor = rnexecutorch::core::tensor;

using rnexecutorch::core::conversions::asType;
using rnexecutorch::core::conversions::fromJsiTypedArray;
using rnexecutorch::core::conversions::getOptionalProperty;
using rnexecutorch::core::conversions::getRequiredProperty;
using rnexecutorch::core::types::DType;

namespace {

/**
 * A token candidate paired with its logit and normalized probability.
 */
struct Candidate {
    int32_t token;
    float logit;
    float prob;
};

/**
 * Applies repetition penalty to the unnormalized logits based on previously generated tokens.
 *
 * For each unique token previously generated:
 * - Positive logits are scaled down by dividing by the penalty factor.
 * - Non-positive logits are penalized by multiplying by the penalty factor.
 *
 * @param logits Logits span to modify in place.
 * @param tokens History of previously generated token IDs.
 * @param penalty Multiplicative repetition penalty factor (> 1.0 penalizes repeats).
 */
void applyRepetitionPenalty(std::span<float> logits, const std::vector<int32_t> &tokens, float penalty) {
    if (penalty == 1.0f || tokens.empty()) {
        return;
    }

    std::unordered_set<int32_t> seen;
    for (int32_t tok : tokens) {
        if (tok < 0 || !std::cmp_less(tok, logits.size()) || !seen.insert(tok).second) {
            continue;
        }
        const auto idx = static_cast<size_t>(tok);
        const float val = logits[idx];
        logits[idx] = (val > 0.0f) ? (val / penalty) : (val * penalty);
    }
}

/**
 * Applies Don't Repeat Yourself (DRY) penalty to unnormalized logits.
 *
 * Scans previous token history to find matching suffixes that would be extended
 * if a previous continuation token is repeated. When a match length meets or exceeds
 * `allowedLength`, an exponential penalty is subtracted from the continuation token's logit:
 *   penalty = multiplier * (base ^ (matchLength - allowedLength))
 *
 * @param logits Logits span to modify in place.
 * @param tokens History of previously generated token IDs.
 * @param multiplier Penalty multiplier factor (> 0).
 * @param base Exponential base (> 0).
 * @param allowedLength Minimum match length before penalty triggers.
 * @param penaltyLastN Maximum recent tokens window to scan (-1 or 0 for unlimited).
 * @param breakers Set of token IDs that break sequence matches and are exempt from penalty.
 */
void applyDry(std::span<float> logits,
              const std::vector<int32_t> &tokens,
              float multiplier,
              float base,
              int32_t allowedLength,
              int32_t penaltyLastN,
              const std::unordered_set<int32_t> &breakers) {
    if (multiplier <= 0.0f || base <= 0.0f || tokens.size() <= 1 || allowedLength < 0) {
        return;
    }

    const size_t totalTokens = tokens.size();
    const size_t windowStart = (penaltyLastN > 0 && std::cmp_greater(totalTokens, penaltyLastN))
                                   ? (totalTokens - static_cast<size_t>(penaltyLastN))
                                   : 0;

    const int32_t lastTok = tokens[totalTokens - 1];
    if (breakers.contains(lastTok)) {
        return;
    }

    std::vector<std::pair<int32_t, float>> maxPenalties;

    // Scan backwards through token history ending before the last token.
    for (size_t i = windowStart; i < totalTokens - 1; ++i) {
        if (tokens[i] != lastTok) {
            continue;
        }

        // Measure how far backwards the match extends.
        size_t matchLen = 1;
        while (matchLen <= (i - windowStart)) {
            const int32_t pastTok = tokens[i - matchLen];
            const int32_t currTok = tokens[totalTokens - 1 - matchLen];
            if (pastTok != currTok || breakers.contains(pastTok)) {
                break;
            }
            ++matchLen;
        }

        if (std::cmp_less(matchLen, allowedLength)) {
            continue;
        }

        const int32_t nextTok = tokens[i + 1];
        if (breakers.contains(nextTok) || nextTok < 0 || !std::cmp_less(nextTok, logits.size())) {
            continue;
        }

        const auto exponent = static_cast<float>(matchLen - static_cast<size_t>(allowedLength));
        float penalty = multiplier * std::pow(base, exponent);
        if (!std::isfinite(penalty)) {
            penalty = std::numeric_limits<float>::infinity();
        }

        auto it = std::ranges::find_if(maxPenalties, [nextTok](const auto &p) { return p.first == nextTok; });
        if (it != maxPenalties.end()) {
            it->second = std::max(it->second, penalty);
        } else {
            maxPenalties.emplace_back(nextTok, penalty);
        }
    }

    for (const auto &[tok, penalty] : maxPenalties) {
        const auto idx = static_cast<size_t>(tok);
        if (std::isinf(penalty)) {
            logits[idx] = -std::numeric_limits<float>::infinity();
        } else {
            logits[idx] -= penalty;
        }
    }
}

/**
 * Invokes the user-defined `constraints` callback from TypeScript to apply constrained decoding.
 *
 * Supports:
 * - `allowedTokens`: Whitelists tokens via Int32Array, setting all other logits to -infinity.
 * - `bannedTokens`: Blacklists tokens via Int32Array, setting their logits to -infinity.
 *
 * @param rt The JSI runtime instance.
 * @param logits Logits span to modify in place.
 * @param constraintsFn The TypeScript callback function.
 * @param ctxVal The SamplingContext object passed to the callback.
 */
void applyConstraintsCallback(jsi::Runtime &rt, std::span<float> logits, const jsi::Function &constraintsFn, const jsi::Value &ctxVal) {
    auto resVal = constraintsFn.call(rt, ctxVal);
    if (resVal.isUndefined() || resVal.isNull()) {
        return;
    }
    const auto resObj = asType<jsi::Object>(rt, "constraints: return value", resVal);
    const size_t vocabSize = logits.size();

    // Whitelist: allowedTokens
    const auto allowedVal = getOptionalProperty<jsi::Value>(rt, "constraints", resObj, "allowedTokens");
    if (allowedVal.has_value()) {
        const auto allowed = fromJsiTypedArray<int32_t>(rt, "constraints: option 'allowedTokens'", *allowedVal);
        std::vector<std::pair<size_t, float>> kept;
        kept.reserve(allowed.size());
        for (int32_t tok : allowed) {
            if (tok < 0 || !std::cmp_less(tok, vocabSize)) {
                continue;
            }
            const auto idx = static_cast<size_t>(tok);
            kept.emplace_back(idx, logits[idx]);
        }
        std::ranges::fill(logits, -std::numeric_limits<float>::infinity());
        for (const auto &[idx, logit] : kept) {
            logits[idx] = logit;
        }
    }

    // Blacklist: bannedTokens
    const auto bannedVal = getOptionalProperty<jsi::Value>(rt, "constraints", resObj, "bannedTokens");
    if (bannedVal.has_value()) {
        const auto banned = fromJsiTypedArray<int32_t>(rt, "constraints: option 'bannedTokens'", *bannedVal);
        for (int32_t tok : banned) {
            if (tok < 0 || !std::cmp_less(tok, vocabSize)) {
                continue;
            }
            logits[static_cast<size_t>(tok)] = -std::numeric_limits<float>::infinity();
        }
    }
}

/**
 * Extracts the highest-scoring candidate tokens from unnormalized logits using a bounded min-heap.
 *
 * Performs a single pass over logits to maintain up to `maxCandidates` tokens,
 * sorts them descending, prunes tail logits below `maxLogit - 16.0f`, and normalizes
 * softmax probabilities.
 *
 * @param logits The shaped logit values.
 * @param maxCandidates Maximum number of candidate tokens to retain (topK).
 * @return A vector of candidates sorted by descending probability, normalized to sum to 1.0.
 */
std::vector<Candidate> applyTopK(std::span<const float> logits, size_t maxCandidates) {
    if (maxCandidates == 0 || logits.empty()) {
        return {};
    }

    std::vector<Candidate> candidates;
    candidates.reserve(maxCandidates);

    auto minHeapCmp = [](const Candidate &a, const Candidate &b) {
        return a.logit > b.logit;
    };

    for (size_t i = 0; i < logits.size(); ++i) {
        const float val = logits[i];

        if (candidates.size() < maxCandidates) {
            if (!std::isfinite(val)) {
                continue;
            }
            candidates.push_back({.token = static_cast<int32_t>(i), .logit = val, .prob = 0.0f});
            if (candidates.size() == maxCandidates) {
                std::ranges::make_heap(candidates, minHeapCmp);
            }
            continue;
        }

        if (!(val > candidates.front().logit)) {
            continue;
        }

        std::ranges::pop_heap(candidates, minHeapCmp);
        candidates.back() = {.token = static_cast<int32_t>(i), .logit = val, .prob = 0.0f};
        std::ranges::push_heap(candidates, minHeapCmp);
    }

    if (candidates.empty()) {
        return {};
    }

    std::ranges::sort_heap(candidates, minHeapCmp);

    const float maxLogit = candidates.front().logit;
    const float cutoff = maxLogit - 16.0f;
    while (candidates.size() > 1 && candidates.back().logit < cutoff) {
        candidates.pop_back();
    }

    float totalWeight = 0.0f;
    for (auto &c : candidates) {
        c.prob = std::exp(c.logit - maxLogit);
        totalWeight += c.prob;
    }

    if (totalWeight <= 0.0f) {
        return {};
    }

    for (auto &c : candidates) {
        c.prob /= totalWeight;
    }

    return candidates;
}

/**
 * Applies Top-P (nucleus) filtering to the candidates.
 *
 * Truncates candidates to the smallest subset whose cumulative probability
 * exceeds topP, then re-normalizes candidate probabilities to sum to 1.0.
 *
 * @param candidates Candidates sorted by descending probability, modified in place.
 * @param topP Cumulative probability threshold in the range (0.0, 1.0).
 */
void applyTopP(std::vector<Candidate> &candidates, float topP) {
    if (topP <= 0.0f || topP >= 1.0f || candidates.empty()) {
        return;
    }

    float cumWeight = 0.0f;
    size_t cutoff = candidates.size() - 1;
    for (size_t i = 0; i < candidates.size(); ++i) {
        cumWeight += candidates[i].prob;
        if (cumWeight >= topP) {
            cutoff = i;
            break;
        }
    }
    candidates.resize(cutoff + 1);

    float total = 0.0f;
    for (const auto &c : candidates) {
        total += c.prob;
    }
    if (total <= 0.0f) {
        return;
    }
    for (auto &c : candidates) {
        c.prob /= total;
    }
}

/**
 * Filters out candidates whose probability is below minP * max_probability.
 *
 * Candidates are assumed to be sorted by descending probability.
 *
 * @param candidates Candidates sorted by descending probability, modified in place.
 * @param minP Minimum relative probability threshold in the range (0.0, 1.0).
 */
void applyMinP(std::vector<Candidate> &candidates, float minP) {
    if (minP <= 0.0f || minP >= 1.0f || candidates.empty()) {
        return;
    }

    const float threshold = candidates[0].prob * minP;
    size_t cutoff = candidates.size();
    for (size_t i = 1; i < candidates.size(); ++i) {
        if (candidates[i].prob < threshold) {
            cutoff = i;
            break;
        }
    }
    candidates.resize(cutoff);

    float total = 0.0f;
    for (const auto &c : candidates) {
        total += c.prob;
    }
    if (total <= 0.0f) {
        return;
    }
    for (auto &c : candidates) {
        c.prob /= total;
    }
}

/**
 * Applies Exclude Top Choices (XTC) filtering to the candidate distribution.
 *
 * When two or more candidates have probabilities >= threshold, the top
 * candidate is removed with probability `probability`, and remaining candidate
 * probabilities are re-normalized.
 *
 * @param candidates Candidates sorted by descending probability, modified in place.
 * @param threshold Probability threshold for considering tokens as "top choices".
 * @param probability Likelihood (0.0 to 1.0) of excluding the top candidate.
 * @param rng Pseudo-random number generator for coin flip.
 */
void applyXtc(std::vector<Candidate> &candidates, float threshold, float probability, std::mt19937 &rng) {
    if (probability <= 0.0f || threshold <= 0.0f || candidates.size() < 2) {
        return;
    }

    size_t count = 0;
    for (const auto &c : candidates) {
        if (c.prob >= threshold) {
            ++count;
        } else {
            break;
        }
    }

    if (count < 2) {
        return;
    }

    std::uniform_real_distribution<float> dist(0.0f, 1.0f);
    if (dist(rng) >= probability) {
        return;
    }

    candidates.erase(candidates.begin());
    float total = 0.0f;
    for (const auto &c : candidates) {
        total += c.prob;
    }
    if (total <= 0.0f) {
        return;
    }
    for (auto &c : candidates) {
        c.prob /= total;
    }
}

/**
 * Rescales candidate probabilities by applying temperature to their original
 * logits.
 *
 * @param candidates Candidates sorted by descending probability, modified in
 * place.
 * @param temperature Temperature scaling factor (> 0.0). If 1.0, no
 * transformation is needed.
 */
void applyTemperature(std::vector<Candidate> &candidates, float temperature) {
    if (temperature == 1.0f || temperature <= 0.0f || candidates.size() <= 1) {
        return;
    }

    const float invTemp = 1.0f / temperature;
    float maxScaledLogit = -std::numeric_limits<float>::infinity();
    for (const auto &c : candidates) {
        maxScaledLogit = std::max(c.logit * invTemp, maxScaledLogit);
    }

    float total = 0.0f;
    for (auto &c : candidates) {
        c.prob = std::exp(c.logit * invTemp - maxScaledLogit);
        total += c.prob;
    }

    if (total <= 0.0f) {
        return;
    }
    for (auto &c : candidates) {
        c.prob /= total;
    }
}

/**
 * Selects the token index with the highest logit value (greedy decoding).
 *
 * @param logits The unnormalized or shaped logits.
 * @return The 0-based token index with the maximum logit value.
 * @throws error::ExecutionFailed If all logits are non-finite or masked.
 */
int32_t sampleArgmax(std::span<const float> logits) {
    int32_t bestIdx = -1;
    float bestVal = -std::numeric_limits<float>::infinity();
    for (size_t i = 0; i < logits.size(); ++i) {
        if (logits[i] > bestVal) {
            bestVal = logits[i];
            bestIdx = static_cast<int32_t>(i);
        }
    }
    if (bestIdx < 0) {
        throw error::ExecutionFailed("sample: No valid candidates available (all logits are non-finite or masked)");
    }
    return bestIdx;
}

/**
 * Samples a token from the candidate distribution using roulette-wheel (multinomial) sampling.
 *
 * @param candidates Candidates with normalized probabilities.
 * @param rng Pseudo-random number generator.
 * @return The selected token ID.
 * @throws error::ExecutionFailed If candidates is empty.
 */
int32_t sampleMultinomial(const std::vector<Candidate> &candidates, std::mt19937 &rng) {
    if (candidates.empty()) {
        throw error::ExecutionFailed("sample: No valid candidates available (all logits are non-finite or masked)");
    }
    if (candidates.size() == 1) {
        return candidates[0].token;
    }

    float total = 0.0f;
    for (const auto &c : candidates) {
        total += c.prob;
    }
    if (total <= 0.0f) {
        return candidates[0].token;
    }

    std::uniform_real_distribution<float> dist(0.0f, total);
    const float r = dist(rng);

    float cum = 0.0f;
    for (const auto &c : candidates) {
        cum += c.prob;
        if (cum >= r) {
            return c.token;
        }
    }
    return candidates.back().token;
}

} // namespace

void install_sample(jsi::Runtime &rt, jsi::Object &module) {
    const auto *name = "sample";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 3) {
            throw error::InvalidArgument("sample: Usage: sample(logits, ctx, options)");
        }

        auto src = tensor::fromJs(rt, "sample: logits", args[0], DType::float32, {1, "vocab_size"});
        auto lock = tensor::tryLockUnique(rt, "sample: logits", src);

        if (src->numel_ == 0) {
            throw error::InvalidArgument("sample: logits tensor is empty");
        }

        auto *data = reinterpret_cast<float *>(src->data_.get());
        std::span<float> logits(data, src->numel_);

        const auto opts = asType<jsi::Object>(rt, "sample: options", args[2]);

        const auto topK = getRequiredProperty<int32_t>(rt, "sample", opts, "topK");
        const auto topP = getRequiredProperty<float>(rt, "sample", opts, "topP");
        const auto minP = getRequiredProperty<float>(rt, "sample", opts, "minP");

        const auto temperature = getRequiredProperty<float>(rt, "sample", opts, "temperature");
        const auto repetitionPenalty = getRequiredProperty<float>(rt, "sample", opts, "repetitionPenalty");

        const auto xtcOptions = getOptionalProperty<jsi::Object>(rt, "sample", opts, "xtc");
        const auto dryOptions = getOptionalProperty<jsi::Object>(rt, "sample", opts, "dry");

        if (topK < 1) {
            throw error::InvalidArgument("sample: option 'topK' must be at least 1");
        }
        if (topP <= 0.0f || topP > 1.0f) {
            throw error::InvalidArgument("sample: option 'topP' must be in (0, 1]");
        }
        if (minP < 0.0f || minP >= 1.0f) {
            throw error::InvalidArgument("sample: option 'minP' must be in [0, 1)");
        }
        if (temperature < 0.0f) {
            throw error::InvalidArgument("sample: option 'temperature' must be non-negative");
        }
        if (repetitionPenalty <= 0.0f) {
            throw error::InvalidArgument("sample: option 'repetitionPenalty' must be positive");
        }

        static thread_local std::mt19937 rng(std::random_device{}());

        /**
         * The sampling pipeline follows the llama.cpp execution sequence:
         * constraints -> penalties -> dry -> top-k -> top-p -> min-p -> xtc -> temperature -> multinomial draw
         *
         * Constraints, penalties and DRY are applied first directly to raw logits
         * so truncation filters operate on the penalized distribution. This matches
         * llama.cpp, where `logit_bias` leads the chain ahead of `penalties` and
         * `dry`.
         *
         * Top-K then hard-prunes the logit space prior to softmax candidate
         * distribution construction.
         *
         * Top-P (nucleus) and Min-P subsequently prune tail candidates based on
         * cumulative and relative probability thresholds.
         *
         * XTC conditionally removes the top choice when multiple competitive
         * candidates exist.
         *
         * Finally, temperature rescales probabilities across surviving
         * candidates before the multinomial draw.
         *
         * Greedy decoding (temperature non-positive or topK one) short-circuits to
         * argmax, but only when XTC is disabled: XTC runs before token selection in
         * llama.cpp and must be able to remove the argmax.
         */

        const auto ctxObj = asType<jsi::Object>(rt, "sample: ctx", args[1]);
        const auto genToksVal = getOptionalProperty<jsi::Value>(rt, "sample: ctx", ctxObj, "generatedTokens");
        const auto genToks = genToksVal.has_value()
                                 ? fromJsiTypedArray<int32_t>(rt, "sample: ctx: 'generatedTokens'", *genToksVal)
                                 : std::vector<int32_t>{};

        auto constraintsFn = getOptionalProperty<jsi::Function>(rt, "sample: constraints", opts, "constraints");
        if (constraintsFn.has_value()) {
            applyConstraintsCallback(rt, logits, constraintsFn.value(), args[1]);
        }

        applyRepetitionPenalty(logits, genToks, repetitionPenalty);

        if (dryOptions.has_value()) {
            const auto dryMultiplier = getRequiredProperty<float>(rt, "sample: dry", *dryOptions, "multiplier");
            const auto dryBase = getRequiredProperty<float>(rt, "sample: dry", *dryOptions, "base");
            const auto dryPenaltyLastN = getRequiredProperty<int32_t>(rt, "sample: dry", *dryOptions, "penaltyLastN");
            const auto dryAllowedLength = getRequiredProperty<int32_t>(rt, "sample: dry", *dryOptions, "allowedLength");

            const auto breakersVal = getRequiredProperty<jsi::Value>(rt, "sample: dry", *dryOptions, "sequenceBreakers");
            const auto breakersVec = fromJsiTypedArray<int32_t>(rt, "sample: dry: option 'sequenceBreakers'", breakersVal);
            const std::unordered_set<int32_t> breakers(breakersVec.begin(), breakersVec.end());

            if (dryMultiplier < 0.0f) {
                throw error::InvalidArgument("sample: dry option 'multiplier' must be non-negative");
            }
            if (dryBase <= 1.0f) {
                throw error::InvalidArgument("sample: dry option 'base' must be greater than 1.0");
            }
            if (dryAllowedLength < 0) {
                throw error::InvalidArgument("sample: dry option 'allowedLength' must be non-negative");
            }
            if (dryPenaltyLastN < -1) {
                throw error::InvalidArgument("sample: dry option 'penaltyLastN' must be -1 or non-negative");
            }

            applyDry(logits, genToks, dryMultiplier, dryBase, dryAllowedLength, dryPenaltyLastN, breakers);
        }

        const bool greedy = temperature <= 0.0f || topK == 1;

        if (greedy && !xtcOptions.has_value()) {
            const int32_t chosen = sampleArgmax(logits);
            return jsi::Value(static_cast<double>(chosen));
        }

        const auto maxCandidates = std::min(static_cast<size_t>(topK), logits.size());

        auto candidates = applyTopK(logits, maxCandidates);

        if (candidates.empty()) {
            throw error::ExecutionFailed("sample: No valid candidates available (all logits are non-finite or masked)");
        }

        applyTopP(candidates, topP);
        applyMinP(candidates, minP);

        if (xtcOptions.has_value()) {
            const auto xtcProbability = getRequiredProperty<float>(rt, "sample: xtc", *xtcOptions, "probability");
            const auto xtcThreshold = getRequiredProperty<float>(rt, "sample: xtc", *xtcOptions, "threshold");

            if (xtcProbability < 0.0f || xtcProbability > 1.0f) {
                throw error::InvalidArgument("sample: xtc option 'probability' must be in [0, 1]");
            }
            if (xtcThreshold < 0.0f || xtcThreshold > 0.5f) {
                throw error::InvalidArgument("sample: xtc option 'threshold' must be in [0, 0.5]");
            }
            applyXtc(candidates, xtcThreshold, xtcProbability, rng);
        }

        applyTemperature(candidates, temperature);

        const int32_t chosen = greedy ? candidates.front().token : sampleMultinomial(candidates, rng);

        return jsi::Value(static_cast<double>(chosen));
    };

    module.setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), 3, error::guarded(fnBody)));
}

} // namespace rnexecutorch::extensions::llm
