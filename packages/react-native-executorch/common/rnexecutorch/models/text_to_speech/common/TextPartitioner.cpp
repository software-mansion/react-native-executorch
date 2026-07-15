#include "TextPartitioner.h"
#include "Constants.h"

#include <algorithm>
#include <deque>
#include <limits>
#include <ranges>

namespace rnexecutorch::models::text_to_speech {

constexpr TextPartitioner::Cost INF = 1e7;

TextPartitioner::TextPartitioner(const TextPartitionerConfig &cfg)
    : config_(cfg) {}

TextPartitioner::Partition TextPartitioner::partition(std::u32string_view input,
                                                      size_t limit) const {
  if (input.empty()) {
    return {input, {}};
  }

  size_t n = input.size();
  std::vector<std::pair<Cost, int64_t>> dp(n, {INF, -1});

  std::deque<size_t> eosPoints, pausePoints, whitePoints;

  // Helper function to estimate the cost of given partitioning.
  auto costFn = [this, limit](Cost acc, size_t beg, int64_t prevBp, int64_t bp,
                              size_t end, Separator sep) -> Cost {
    if (end - bp > limit) {
      return INF;
    }

    Cost sepPenalty = sep == Separator::EOS     ? config_.eosCost
                      : sep == Separator::PAUSE ? config_.pauseCost
                      : sep == Separator::WHITE ? config_.whiteCost
                                                : 0;

    int64_t rightmostRangeLength = end - bp;
    int64_t prevRangeLength = bp - prevBp;

    int64_t latency = std::max(static_cast<int64_t>(0),
                               rightmostRangeLength - prevRangeLength);
    int64_t discount =
        config_.tokenDiscountFactor *
        std::max(static_cast<int64_t>(0), config_.tokenDiscountRange - bp - 1);

    return acc +
           static_cast<Cost>(latency * discount / config_.tokenDiscountRange) +
           sepPenalty;
  };

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
        auto cost = costFn(dp[breakIdx].first, 0, dp[breakIdx].second, breakIdx,
                           i, sep);
        if (cost < bestCost && breakIdx > 0) {
          bestCost = cost;
          prevBpIdx = breakIdx;
        }
      }
    }

    char32_t c = input[i];
    if (constants::kEndOfSentenceCharacters.contains(c)) {
      eosPoints.push_back(i);
    } else if (constants::kPauseCharacters.contains(c)) {
      pausePoints.push_back(i);
    } else if (c < 256 && std::isspace(static_cast<char>(c))) {
      whitePoints.push_back(i);
    }
  }

  std::vector<std::pair<size_t, size_t>> segments;
  int64_t currBp = dp.back().second;
  size_t lastIdx = n;

  // Backtracking
  while (currBp != -1) {
    size_t start = static_cast<size_t>(currBp + 1);
    segments.emplace_back(start, lastIdx - start);
    lastIdx = currBp + 1;
    currBp = dp[currBp].second;
  }
  segments.emplace_back(0, lastIdx);

  // Because of backtracking, the segments are placed in reversed order.
  std::ranges::reverse(segments);

  return {input, std::move(segments)};
}

} // namespace rnexecutorch::models::text_to_speech
