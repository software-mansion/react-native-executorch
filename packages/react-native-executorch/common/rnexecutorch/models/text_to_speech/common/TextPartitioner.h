#pragma once

#include <cstdint>
#include <string>
#include <utility>
#include <vector>

namespace rnexecutorch::models::text_to_speech {

// Controls the behavior of partitioning algorithm.
struct TextPartitionerConfig {
  /**
   * Penalty applied when splitting at an end-of-sentence breakpoint (e.g., '.',
   * '!', '?'). Lower values make the algorithm prefer splitting at these
   * points.
   */
  uint64_t eosCost = 5;

  /**
   * Penalty applied when splitting at a mid-sentence pause breakpoint (e.g.,
   * ',', ';', ':'). Lower values make the algorithm prefer splitting at these
   * points.
   */
  uint64_t pauseCost = 18;

  /**
   * Penalty applied when splitting at a whitespace breakpoint.
   * Lower values make the algorithm prefer splitting at these points.
   */
  uint64_t whiteCost = 1000;

  /**
   * Decides on how much more are big latencies in the beginning phase of
   * an input text penalized.
   */
  int64_t tokenDiscountFactor = 1;

  /**
   * Decides on how quickly latency penalties (linearly interpolated) evaporate
   * with each processed token.
   * For example, using tokenDiscountRange = 128 means that after reaching
   * 128 tokens, the latency is completely omitted and not penalized.
   */
  int64_t tokenDiscountRange = 128;
};

// Main partitioning mechanism.
class TextPartitioner {
public:
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
  using Cost = uint64_t;

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

  explicit TextPartitioner(const TextPartitionerConfig &config);

  /**
   * Partitions the input text into segments.
   *
   * @param input The source text to be partitioned.
   * @param limit The maximum available size of a single segment.
   * @return A Partition object containing the original content view and
   * breakpoints.
   */
  Partition partition(std::u32string_view input, size_t limit) const;

private:
  TextPartitionerConfig config_;
};

} // namespace rnexecutorch::models::text_to_speech
