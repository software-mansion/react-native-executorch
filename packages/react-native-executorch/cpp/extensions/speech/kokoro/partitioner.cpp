#include "partitioner.h"

#include <algorithm>
#include <deque>
#include <limits>
#include <phonemis/utils/conversions.h>
#include <ranges>
#include <unordered_set>

namespace rnexecutorch::extensions::speech::kokoro {

namespace jsi = facebook::jsi;

/**
 * Custom infinity definition.
 *
 * It's for safety - because it's not a max int (such as in std::limits case),
 * performing some calculations on it won't lead to an overflow.
 */
constexpr Cost kInf = 1e7;

/**
 * Hyperparameters - heuristic cost estimations per breakpoint type.
 */
constexpr Cost kEosCost = 5;
constexpr Cost kPauseCost = 18;
constexpr Cost kWhiteCost = 1000;

/**
 * Hyperparameters - latency factor discount algorithm.
 *
 * The point behind it is that we care less about the latency, the more
 * text we process (assuming that playing processed speech takes longer
 * than processing the next segment).
 */
constexpr int64_t kDiscountFactor = 1;
constexpr int64_t kDiscountRange = 128;

// character sets
const std::unordered_set<char32_t> kEosChars = {
    U'.',
    U'?',
    U'!',
    U';',
    U'…',
    U'|',
    U'।',
    U'॥',
    U'¿',
    U'¡',
};
const std::unordered_set<char32_t> kPauseChars = {
    U',',
    U':',
    U'-',
    U'—',
    U'«',
    U'»',
};

/**
 * Latency-first cost function.
 * Designed to minimize the latency, so likes splitting into short
 * segments at the beginning, and long at the end.
 */
static Cost latencyCost(Cost acc, size_t /*beg*/, int64_t prevBp,
                        int64_t bp, size_t end, Separator sep, size_t limit) {
    if (end - static_cast<size_t>(bp) > limit) {
        return kInf;
    }

    Cost sepPenalty = sep == Separator::EOS     ? kEosCost
                      : sep == Separator::PAUSE ? kPauseCost
                      : sep == Separator::WHITE ? kWhiteCost
                                                : 0;

    int64_t rightmost = static_cast<int64_t>(end) - bp;
    int64_t prevRange = bp - prevBp;
    int64_t latency = std::max(int64_t{0}, rightmost - prevRange);
    int64_t discount = kDiscountFactor *
                       std::max(int64_t{0}, kDiscountRange - bp - 1);

    return acc +
           static_cast<Cost>(latency * discount / kDiscountRange) +
           sepPenalty;
}

static std::vector<Segment> partition(std::u32string_view input,
                                      size_t limit) {
    if (input.empty()) {
        return {};
    }

    size_t n = input.size();
    std::vector<std::pair<Cost, int64_t>> dp(n, {kInf, -1});

    std::deque<size_t> eosPoints, pausePoints, whitePoints;

    for (size_t i = 0; i < n; ++i) {
        auto &[bestCost, prevBpIdx] = dp[i];

        bestCost = latencyCost(0, 0, -1, -1, i + 1, Separator::NO_SEP, limit);

        for (auto *q : {&eosPoints, &pausePoints, &whitePoints}) {
            while (!q->empty() && q->front() + limit < i) {
                q->pop_front();
            }

            Separator sep = q == &eosPoints     ? Separator::EOS
                            : q == &pausePoints ? Separator::PAUSE
                                                : Separator::WHITE;
            for (size_t breakIdx : (*q)) {
                auto cost = latencyCost(dp[breakIdx].first, 0,
                                        dp[breakIdx].second,
                                        static_cast<int64_t>(breakIdx), i,
                                        sep, limit);
                if (cost < bestCost && breakIdx > 0) {
                    bestCost = cost;
                    prevBpIdx = static_cast<int64_t>(breakIdx);
                }
            }
        }

        char32_t c = input[i];
        if (kEosChars.contains(c)) {
            eosPoints.push_back(i);
        } else if (kPauseChars.contains(c)) {
            pausePoints.push_back(i);
        } else if (c < 256 && std::isspace(static_cast<char>(c))) {
            whitePoints.push_back(i);
        }
    }

    std::vector<Segment> segments;
    int64_t currBp = dp.back().second;
    size_t lastIdx = n;

    while (currBp != -1) {
        size_t start = static_cast<size_t>(currBp + 1);
        segments.emplace_back(start, lastIdx - start);
        lastIdx = static_cast<size_t>(currBp + 1);
        currBp = dp[static_cast<size_t>(currBp)].second;
    }
    segments.emplace_back(0, lastIdx);

    // Because of backtracking, the segments are in the reversed order.
    std::ranges::reverse(segments);

    return segments;
}

void install_partition(jsi::Runtime &rt, jsi::Object &module) {
    auto name = "partition";
    auto fnBody = [](jsi::Runtime &rt, const jsi::Value &,
                     const jsi::Value *args, size_t count) -> jsi::Value {
        if (count != 2) {
            throw jsi::JSError(rt, "partition: Usage: partition(phonemes, maxTokens)");
        }
        if (!args[0].isString()) {
            throw jsi::JSError(rt, "partition: Expected a string as first argument");
        }
        if (!args[1].isNumber()) {
            throw jsi::JSError(rt, "partition: Expected a number as second argument");
        }

        auto text = args[0].asString(rt).utf8(rt);
        size_t limit = static_cast<size_t>(args[1].asNumber());

        auto input = phonemis::utils::conversions::utf8_to_u32(text);
        auto segments = partition(input, limit);

        auto jsArray = jsi::Array(rt, segments.size());
        for (size_t i = 0; i < segments.size(); ++i) {
            auto obj = jsi::Object(rt);
            obj.setProperty(rt, "offset",
                            static_cast<double>(segments[i].offset));
            obj.setProperty(rt, "length",
                            static_cast<double>(segments[i].length));
            jsArray.setValueAtIndex(rt, i, obj);
        }

        return jsArray;
    };

    module.setProperty(
        rt, name,
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 2, fnBody));
}

} // namespace rnexecutorch::extensions::speech::kokoro
