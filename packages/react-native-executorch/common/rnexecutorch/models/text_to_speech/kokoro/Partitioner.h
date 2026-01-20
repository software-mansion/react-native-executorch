#pragma once

#include <cstdint>
#include <functional>
#include <optional>
#include <string>
#include <vector>

#include "Types.h"

namespace rnexecutorch::models::text_to_speech::kokoro {

class Partitioner {
public:
  Partitioner(const Context &modelContext) : context_(modelContext) {}

  // Partition strategy
  // Defines how to divide phoneme string into substrings, by minimizing
  // one of the selected properties.
  enum class Strategy {
    TOTAL_TIME = 0, // Only minimizes the estimated total time of processing
    LATENCY, // Minimizes the streaming latency by dividing into small and
             // similar length parts
  };

  // Cost definition
  using Cost = int64_t;

  // Partition function
  // Performs a division of the input phoneme string according to
  // given strategy.
  template <Strategy strategy>
  std::vector<std::u32string> divide(const std::u32string &phonemes);

private:
  /**
   * Helper function - partitioning
   *
   * @param phonemes phoneme string to be partitioned
   * @param costFn a custom cost function which takes:
   *               1. starting cost (cost of the previous range or 0 if not
   * present)
   *               2. range begin
   *               3. previous breakpoint (-1 if not present)
   *               4. current breakpoint (-1 if not present)
   *               5. range end (exclusive)
   */
  std::vector<std::u32string>
  divide(const std::u32string &phonemes,
         const std::function<Cost(Cost, int32_t, int32_t, int32_t, int32_t)>
             &costFn);

  // Shared model context
  // A const reference to singleton in Kokoro.
  const Context &context_;
};

} // namespace rnexecutorch::models::text_to_speech::kokoro