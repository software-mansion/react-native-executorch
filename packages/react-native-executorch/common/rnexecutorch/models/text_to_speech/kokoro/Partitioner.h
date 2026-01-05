#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace rnexecutorch::models::text_to_speech::kokoro::partitioner {

// Cost definition
// Cost is a heuristic value associated with each substring
// obtained after a division. The goal of the partitioning is
// to minimize the cost.
using Cost = int32_t;

// Partition strategy
// Defines how to divide phoneme string into substrings, by minimizing
// one of the selected properties.
enum class Strategy {
  TOTAL_TIME = 0, // Only minimizes the estimated total time of processing
  LATENCY, // Minimizes the streaming latency by dividing into small and similar
           // length parts
};

// Partition function
// Performs a division of the input phoneme string according to
// given strategy.
template <Strategy strategy>
std::vector<std::u32string> divide(const std::u32string &phonemes);

} // namespace rnexecutorch::models::text_to_speech::kokoro::partitioner