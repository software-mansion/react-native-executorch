#pragma once

#include "Types.h"

#include <cstdint>
#include <functional>
#include <optional>
#include <string>
#include <vector>

namespace rnexecutorch::models::text_to_speech::kokoro {

class Partitioner {
public:
  /**
   * Partitioning strategy.
   * Affects the cost function choice, which changes the way input text is
   * divided.
   */
  enum class Mode {
    MIN_BREAKS = 0, // Minimizes number of substrings (best quality)
    MIN_LATENCY =
        1, // Minimizes the processing latency (best speed - streaming mode)
  };

  /**
   * Represents the logical separator types.
   */
  enum class Separator {
    EOS = 1, // End of sentence marker (e.g., '.', '!', '?').
    PAUSE,   // Mid-sentence pause (e.g., ',', ';', ':').
    WHITE,   // Whitespace or other weak separators.

    NO_SEP // No separation
  };

  /**
   * Represents a heuristic evaluation of given partition.
   * The lower it is, the better partition is.
   */
  using Cost = uint32_t;

  /**
   * A cost function type to evaluate given partition.
   *
   * @param acc Total cost accumulated from previous segments.
   * @param beg Start index of the current range.
   * @param prevBp Previous breakpoint index - useful for calculating some
   * formulas.
   * @param bp Breakpoint index (the split point, and the last character of the
   * left-most subrange). -1 if there are no bps.
   * @param end End index of the current range (inclusive).
   * @param sep The type of the breakpoint.
   */
  using CostFn = std::function<Cost(Cost acc, size_t beg, int64_t prevBp,
                                    int64_t bp, size_t end, Separator sep)>;

  /**
   * Holds the result of text partitioning.
   * The content is stored as logical views to avoid copying. Segments
   * defines ranges of the content views for smaller segments.
   */
  struct Partition {
    std::u32string_view content;
    std::vector<std::pair<size_t, size_t>>
        segments; // Pairs of {offset, length} for each segment.
  };

  /**
   * Partitions the input text into segments according to the specified
   * strategy.
   *
   * @param input The source text to be partitioned.
   * @param limit The maximum available size of a single segment.
   * @param mode The partitioning strategy to use (defaults to MIN_LATENCY).
   * @return A Partition object containing the original content view and
   * breakpoints.
   */
  Partition partition(std::u32string_view input, size_t limit,
                      Mode mode = Mode::MIN_LATENCY) const;

private:
  // Internal partition implementation that uses a specific cost function.
  Partition partition(std::u32string_view input, size_t limit,
                      CostFn costFn) const;
};

} // namespace rnexecutorch::models::text_to_speech::kokoro