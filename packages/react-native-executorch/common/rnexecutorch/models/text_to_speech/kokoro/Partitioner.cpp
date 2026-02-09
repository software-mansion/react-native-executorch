#include "Partitioner.h"
#include "Constants.h"
#include "Params.h"
#include <algorithm>
#include <functional>
#include <queue>
#include <rnexecutorch/Error.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using namespace params::partitioning;

// Custom infinity definition
constexpr Partitioner::Cost INF = 1e7;

template <>
std::vector<std::u32string>
Partitioner::divide<Partitioner::Strategy::TOTAL_TIME>(
    const std::u32string &phonemes) {
  return divide(phonemes,
                [this](Cost prevCost, int32_t rangeBegin, int32_t prevBp,
                       int32_t currBp, int32_t rangeEnd) {
                  if (rangeEnd - currBp - 1 > context_.inputTokensLimit)
                    return INF;

                  // Simply cumulate the costs for both subranges
                  return prevCost + static_cast<Cost>(rangeEnd - currBp - 1);
                });
}

template <>
std::vector<std::u32string> Partitioner::divide<Partitioner::Strategy::LATENCY>(
    const std::u32string &phonemes) {
  return divide(phonemes, [this](Cost prevCost, int32_t rangeBegin,
                                 int32_t prevBp, int32_t currBp,
                                 int32_t rangeEnd) {
    if (rangeEnd - currBp - 1 > context_.inputTokensLimit)
      return INF;

    // Estimate the latency (simple linear difference between the rightmost
    // subranges)
    int32_t latency = std::max(0, (rangeEnd - currBp) - (currBp - prevBp));

    // Estimate the discount factor (the further we go, the less we care about
    // the latency)
    int32_t discount =
        kTokenDiscountFactor * std::max(0, kTokenDiscountRange - currBp - 1);

    return prevCost +
           static_cast<Cost>(latency * discount / kTokenDiscountRange);
  });
}

// Helper function - partitioning
// A template which is controled by concrete operator instead of
// an abstract Strategy argument.
// Utilizes dynamic programming approach for finding the
// optimal solution.
std::vector<std::u32string> Partitioner::divide(
    const std::u32string &phonemes,
    const std::function<Cost(Cost, int32_t, int32_t, int32_t, int32_t)>
        &costFn) {
  // DP array
  // (cost, prev_breakpoint_idx) pairs
  std::vector<std::pair<Cost, int32_t>> mem(phonemes.size(), {INF, -1});

  // Keep the potential break point indices to speed up the calculation.
  std::deque<int32_t> eosPoints, pausePoints, whitePoints;

  for (int32_t i = 0; i < phonemes.size(); i++) {
    auto &[estimation, prevBreakIdx] = mem[i];

    // We assume that phonemes[i] is the last character of currently analyzed
    // substring. First, estimate for the entire substring without further
    // division.
    estimation = costFn(0, 0, -1, -1, i + 1);

    // Now, try to divide into 2 substring and utilize already calculated values
    // for left-side substring.
    for (auto *q : {&eosPoints, &pausePoints, &whitePoints}) {
      // First, clear the queus from useless entries (out of even largest model
      // bounds).
      while (!q->empty() && q->front() + context_.inputTokensLimit < i) {
        q->pop_front();
      }

      // Now iterate through the reimaining positions.
      Cost penalty = q == &eosPoints     ? kEosPenalty
                     : q == &pausePoints ? kPausePenalty
                                         : kWhitePenalty;
      for (int32_t breakIdx : (*q)) {
        Cost newEstimation = costFn(mem[breakIdx].first, 0,
                                    mem[breakIdx].second, breakIdx, i + 1) +
                             penalty;
        if (newEstimation < estimation && breakIdx > 0) {
          estimation = newEstimation;
          prevBreakIdx = breakIdx;
        }
      }
    }

    // Add current phoneme to the appropriate queue.
    char32_t phoneme = phonemes[i];
    if (constants::kEndOfSentencePhonemes.contains(phoneme)) {
      eosPoints.push_back(i);
    } else if (constants::kPausePhonemes.contains(phoneme)) {
      pausePoints.push_back(i);
    } else if (phoneme < 256 && std::isspace(static_cast<char>(phoneme))) {
      whitePoints.push_back(i);
    }
  }

  std::vector<std::u32string> result = {};

  // Perform backtracking to obtain all the substrings.
  // Note that because of backtracking, the order is reversed.
  int32_t end = phonemes.size() - 1;
  while (end != -1) {
    int32_t begin = mem[end].second + 1;
    result.push_back(phonemes.substr(begin, end - begin + 1));
    end = mem[end].second;
  }

  std::ranges::reverse(result);

  return result;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro