#include "Partitioner.h"
#include "Constants.h"
#include <algorithm>
#include <functional>
#include <queue>
#include <stdexcept>

namespace rnexecutorch::models::text_to_speech::kokoro {

// Custom infinity definition
constexpr Partitioner::Cost INF = 1e5;

template <>
std::vector<std::u32string>
Partitioner::divide<Partitioner::Strategy::TOTAL_TIME>(
    const std::u32string &phonemes) {
  // Update the small model cost back to normal
  modelCosts_.at("small") = 4;

  return divide(phonemes, [](Cost a, Cost b) { return a + b; });
}

template <>
std::vector<std::u32string> Partitioner::divide<Partitioner::Strategy::LATENCY>(
    const std::u32string &phonemes) {
  // In streaming mode, we particularly want to avoid using
  // small model, since it might introduce a bigger latency
  // if followed by the large model.
  modelCosts_.at("small") = INF;

  if (phonemes.size() <= constants::kInputMedium.noTokens - 2)
    return {phonemes};

  // Try to start with a medium-sized model, which is relatively quick
  // and does not introduce that much of a latency.
  int32_t lastEos = -1;
  for (int i = 0; i < constants::kInputMedium.noTokens - 2; i++) {
    bool isFollowedByEos =
        constants::kEndOfSentencePhonemes.contains(phonemes[i + 1]);
    if (constants::kEndOfSentencePhonemes.contains(phonemes[i]) &&
        !isFollowedByEos)
      lastEos = i;
  }

  if (!fixedModel_.has_value() &&
      lastEos > constants::kInputSmall.noTokens - 2) {
    std::vector<std::u32string> result = {phonemes.substr(0, lastEos + 1)};
    auto rest =
        divide(phonemes.substr(lastEos + 1, phonemes.size() - lastEos - 1),
               [](Cost a, Cost b) { return a + b; });
    result.insert(result.end(), std::make_move_iterator(rest.begin()),
                  std::make_move_iterator(rest.end()));
    return result;
  }

  return divide(phonemes, [](Cost a, Cost b) { return a + b; });
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
    estimation = cost(i + 1);

    // Now, try to divide into 2 substring and utilize already calculated values
    // for left-side substring.
    for (auto *q : {&eosPoints, &pausePoints, &whitePoints}) {
      // First, clear the queus from useless entries (out of even largest model
      // bounds).
      while (!q->empty() && q->front() < i - constants::kInputLarge.noTokens)
        q->pop_front();

      // Now iterate through the reimaining positions.
      Cost penalty = q == &eosPoints     ? eosPenalty
                     : q == &pausePoints ? pausePenalty
                                         : whitePenalty;
      for (int32_t breakIdx : (*q)) {
        Cost newEstimation =
            op(mem[breakIdx].first, cost(i - breakIdx)) + penalty;
        if (newEstimation < estimation && breakIdx > 0) {
          estimation = newEstimation;
          prevBreakIdx = breakIdx;
        }
      }
    }

    // Add current phoneme to the appropriate queue.
    char32_t phoneme = phonemes[i];
    if (constants::kEndOfSentencePhonemes.contains(phoneme))
      eosPoints.push_back(i);
    else if (constants::kPausePhonemes.contains(phoneme))
      pausePoints.push_back(i);
    else if (phoneme < 256 && std::isspace(static_cast<char>(phoneme)))
      whitePoints.push_back(i);
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

  std::reverse(result.begin(), result.end());

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
  Cost baseCost =
      effSize <= modelConfig.noTokens ? modelCosts_.at(activeModel) : INF;

  // Scale the cost according to sentence length / input proportion.
  // The idea is to penalize creating sentences much shorter than
  // corresponding input length.
  if (effSize < modelConfig.noTokens) {
    baseCost += baseCost * (modelConfig.noTokens - effSize) *
                (modelConfig.noTokens - effSize) /
                (modelConfig.noTokens * modelConfig.noTokens);
  }

  return baseCost;
}

// Helper function - cost estimation (by string)
Partitioner::Cost Partitioner::cost(const std::u32string &phonemes) {
  return cost(phonemes.size());
}

} // namespace rnexecutorch::models::text_to_speech::kokoro