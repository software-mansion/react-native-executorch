#pragma once

#include <cstdint>
#include <jsi/jsi.h>
#include <vector>

namespace rnexecutorch::extensions::speech::kokoro {

/**
 * Defines possible break points in the text.
 */
enum class Separator {
    EOS = 1, // End of sentence = special characters like . or ?
    PAUSE,   // Pause = special characters like , or -
    WHITE,   // Whitespace characters (word boundary)
    NO_SEP   // No separation
};

/**
 * Measures the quality of partition. Lower = better.
 */
using Cost = uint64_t;

/**
 * A result of the partition operation.
 * Segment is defined by length and it's offset from the beginning of the input string.
 */
struct Segment {
    size_t offset;
    size_t length;
};

void install_partition(facebook::jsi::Runtime &rt,
                       facebook::jsi::Object &module);

} // namespace rnexecutorch::extensions::speech::kokoro
