#pragma once

#include <cstdint>
#include <functional>
#include <optional>
#include <string>
#include <vector>

namespace rnexecutorch::models::text_to_speech::kokoro {

class Partitioner {
public:
  // Partition strategy
  // Defines how to divide phoneme string into substrings, by minimizing
  // one of the selected properties.
  enum class Strategy {
    TOTAL_TIME = 0, // Only minimizes the estimated total time of processing
    LATENCY, // Minimizes the streaming latency by dividing into small and
             // similar length parts
  };

  // Cost definition
  using Cost = int32_t;

  // Partition function
  // Performs a division of the input phoneme string according to
  // given strategy.
  template <Strategy strategy>
  std::vector<std::u32string> divide(const std::u32string &phonemes);

  // Extra options setters
  void setFixedModel(const std::string &modelLabel);
  void resetOptions();

private:
  // Helper function - partitioning
  std::vector<std::u32string> divide(const std::u32string &phonemes,
                                     const std::function<Cost(Cost, Cost)> &op);
  // Helper function - cost estimation (by string size)
  Cost cost(size_t stringSize);
  // Helper function - cost estimation (by string)
  Cost cost(const std::u32string &phonemes);

  // Predefined costs
  // Affect the algorithm behavior in selecting break points and
  // therefore partitioning the strings.
  std::unordered_map<std::string, Cost> modelCosts_ = {
      {"small", 40}, {"medium", 70}, {"large", 100}};
  Cost eosPenalty = 0;
  Cost pausePenalty = 30;
  Cost whitePenalty = 80;

  // Extra settings
  std::optional<std::string> fixedModel_ = std::nullopt;
};

} // namespace rnexecutorch::models::text_to_speech::kokoro