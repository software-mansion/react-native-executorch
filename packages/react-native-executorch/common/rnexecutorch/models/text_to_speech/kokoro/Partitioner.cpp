#include "Partitioner.h"
#include "Constants.h"
#include "Params.h"

#include <algorithm>
#include <deque>
#include <limits>

namespace rnexecutorch::models::text_to_speech::kokoro {

using namespace params::partitioning;

// Custom infinity definition
constexpr Partitioner::Cost INF = 1e7;

Partitioner::Partition Partitioner::partition(std::u32string_view input,
                                              size_t limit, Mode mode) const {
  if (mode == Mode::MIN_BREAKS) {
    return partition(input, limit,
                     [limit](Cost acc, size_t beg, int64_t prevBp, int64_t bp,
                             size_t end, Separator sep) -> Cost {
                       if (end - bp > limit) {
                         return INF;
                       }

                       Cost sepPenalty = sep == Separator::EOS     ? 1
                                         : sep == Separator::PAUSE ? 3
                                         : sep == Separator::WHITE ? 1000
                                                                   : 0;

                       return acc + sepPenalty + static_cast<Cost>(end - bp);
                     });
  }

  if (mode == Mode::MIN_LATENCY) {
    return partition(
        input, limit,
        [limit](Cost acc, size_t beg, int64_t prevBp, int64_t bp, size_t end,
                Separator sep) -> Cost {
          if (end - bp > limit) {
            return INF;
          }

          Cost sepPenalty = sep == Separator::EOS     ? 5
                            : sep == Separator::PAUSE ? 18
                            : sep == Separator::WHITE ? 1000
                                                      : 0;

          int64_t rightmostRangeLength = end - bp;
          int64_t prevRangeLength = bp - prevBp;

          int64_t latency = std::max(static_cast<int64_t>(0),
                                     rightmostRangeLength - prevRangeLength);
          int64_t discount =
              kTokenDiscountFactor *
              std::max(static_cast<int64_t>(0), kTokenDiscountRange - bp - 1);

          return acc +
                 static_cast<Cost>(latency * discount / kTokenDiscountRange) +
                 sepPenalty;
        });
  }

  return {input, {}};
}

Partitioner::Partition Partitioner::partition(std::u32string_view input,
                                              size_t limit,
                                              CostFn costFn) const {
  if (input.empty()) {
    return {input, {}};
  }

  size_t n = input.size();
  std::vector<std::pair<Cost, int64_t>> dp(n, {INF, -1});

  std::deque<size_t> eosPoints, pausePoints, whitePoints;

  for (size_t i = 0; i < n; ++i) {
    auto &[bestCost, prevBpIdx] = dp[i];

    bestCost = costFn(0, 0, -1, -1, i + 1, Separator::NO_SEP);

    for (auto *q : {&eosPoints, &pausePoints, &whitePoints}) {
      while (!q->empty() && q->front() + limit < i) {
        q->pop_front();
      }

      Separator sep = q == &eosPoints     ? Separator::EOS
                      : q == &pausePoints ? Separator::PAUSE
                                          : Separator::WHITE;
      for (size_t breakIdx : (*q)) {
        Cost cost = costFn(dp[breakIdx].first, 0, dp[breakIdx].second, breakIdx,
                           i, sep);
        if (cost < bestCost && breakIdx > 0) {
          bestCost = cost;
          prevBpIdx = breakIdx;
        }
      }
    }

    char32_t c = input[i];
    if (constants::kEndOfSentencePhonemes.contains(c)) {
      eosPoints.push_back(i);
    } else if (constants::kPausePhonemes.contains(c)) {
      pausePoints.push_back(i);
    } else if (c < 256 && std::isspace(static_cast<char>(c))) {
      whitePoints.push_back(i);
    }
  }

  std::vector<std::pair<size_t, size_t>> segments;
  int64_t currBp = dp[n - 1].second;
  size_t lastIdx = n;

  while (currBp != -1) {
    size_t start = static_cast<size_t>(currBp + 1);
    segments.emplace_back(start, lastIdx - start);
    lastIdx = static_cast<size_t>(currBp + 1);
    currBp = dp[currBp].second;
  }
  // Add the first segment
  segments.emplace_back(0, lastIdx);

  std::reverse(segments.begin(), segments.end());

  return {input, std::move(segments)};
}

} // namespace rnexecutorch::models::text_to_speech::kokoro
