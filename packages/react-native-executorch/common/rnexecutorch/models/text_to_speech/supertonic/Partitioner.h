#pragma once

#include <cstdint>
#include <functional>
#include <string>
#include <utility>
#include <vector>

namespace rnexecutorch::models::text_to_speech::supertonic {

/**
 * Splits input text into synthesizable segments, minimizing either the number
 * of breaks (best quality) or the latency (best for streaming).
 *
 * Direct port of the Kokoro partitioner — the algorithm is model-agnostic; only
 * the cost weights (Params.h) and the separator character sets (Constants.h)
 * are Supertonic's.
 */
class Partitioner {
public:
  enum class Mode {
    MIN_BREAKS = 0,  // fewest segments (offline generate)
    MIN_LATENCY = 1, // earliest first segment (streaming)
  };

  enum class Separator { EOS = 1, PAUSE, WHITE, NO_SEP };

  using Cost = uint64_t;

  using CostFn = std::function<Cost(Cost acc, size_t beg, int64_t prevBp,
                                    int64_t bp, size_t end, Separator sep)>;

  struct Partition {
    std::u32string_view content;
    std::vector<std::pair<size_t, size_t>> segments; // {offset, length}
  };

  Partition partition(std::u32string_view input, size_t limit,
                      Mode mode = Mode::MIN_LATENCY) const;

private:
  Partition partition(std::u32string_view input, size_t limit,
                      CostFn costFn) const;
};

} // namespace rnexecutorch::models::text_to_speech::supertonic
