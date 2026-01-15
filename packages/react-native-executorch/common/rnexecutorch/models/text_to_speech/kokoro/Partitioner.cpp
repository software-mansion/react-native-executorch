#include "Partitioner.h"
#include "Constants.h"
#include <algorithm>
#include <functional>
#include <queue>
#include <stdexcept>

namespace rnexecutorch::models::text_to_speech::kokoro {

// Custom infinity definition
constexpr Partitioner::Cost INF = 1e7;

template <>
std::vector<std::u32string>
Partitioner::divide<Partitioner::Strategy::TOTAL_TIME>(
    const std::u32string &phonemes) {
  return divide(
      phonemes,
      [this](size_t rangeBeg, size_t rangeSize) {
        return this->cost(rangeSize);
      },
      [](Cost a, Cost b) { return a + b; });
}

template <>
std::vector<std::u32string> Partitioner::divide<Partitioner::Strategy::LATENCY>(
    const std::u32string &phonemes) {
  if (phonemes.size() <= constants::kInputMedium.noTokens - 2) {
    return {phonemes};
  }

  return divide(
      phonemes,
      [this](size_t rangeBeg, size_t rangeSize) {
        Cost c = this->cost(rangeSize);
        // We want to penalize putting long inputs at the beginning of the
        // processing. Note that it usually takes longer to play out the audio
        // instead of process it, so long fragments near the end do not afffect
        // the latency.
        return std::max(c,
                        c * 128 / std::max(2, static_cast<int32_t>(rangeBeg)));
      },
      [](Cost a, Cost b) { return a + b; });
}

void Partitioner::setFixedModel(const std::string &modelLabel) {
  if (!constants::kInputs.contains(modelLabel))
    throw std::invalid_argument("Partitioner: invalid fixed model label");

  fixedModel_ = {modelLabel};
}

void Partitioner::resetOptions() { fixedModel_ = std::nullopt; }

// Helper function - partitioning
// A template which is controled by concrete operator instead of
// an abstract Strategy argument.
// Utilizes dynamic programming approach for finding the
// optimal solution.
std::vector<std::u32string>
Partitioner::divide(const std::u32string &phonemes,
                    const std::function<Cost(size_t, size_t)> &costFn,
                    const std::function<Cost(Cost, Cost)> &op) {
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
    estimation = costFn(0, i + 1);

    // Now, try to divide into 2 substring and utilize already calculated values
    // for left-side substring.
    for (auto *q : {&eosPoints, &pausePoints, &whitePoints}) {
      // First, clear the queus from useless entries (out of even largest model
      // bounds).
      while (!q->empty() && q->front() < i - constants::kInputLarge.noTokens) {
        q->pop_front();
      }

      // Now iterate through the reimaining positions.
      Cost penalty = q == &eosPoints     ? eosPenalty
                     : q == &pausePoints ? pausePenalty
                                         : whitePenalty;
      for (int32_t breakIdx : (*q)) {
        Cost newEstimation =
            op(mem[breakIdx].first, costFn(breakIdx + 1, i - breakIdx)) +
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

// Helper function - cost estimation (by string size)
Partitioner::Cost Partitioner::cost(size_t stringSize) {
  size_t effSize = stringSize + 2;

  // If fixed model is set, we are limited to using only one of the models.
  std::string activeModel =
      fixedModel_.has_value()                       ? fixedModel_.value()
      : effSize <= constants::kInputSmall.noTokens  ? "small"
      : effSize <= constants::kInputMedium.noTokens ? "medium"
                                                    : "large";

  const Configuration &modelConfig = constants::kInputs.at(activeModel);
  return effSize <= modelConfig.noTokens ? modelCosts_.at(activeModel) : INF;
}

// Helper function - cost estimation (by string)
Partitioner::Cost Partitioner::cost(const std::u32string &phonemes) {
  return cost(phonemes.size());
}

} // namespace rnexecutorch::models::text_to_speech::kokoro