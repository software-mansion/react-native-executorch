#pragma once

#include <cstdint>
#include <vector>

namespace rnexecutorch::core {

// Dimension index must be strictly non-negative.
using Dimension = uint32_t;

// Defines number of elements along a specific dimension (in a tensor).
using DSize = int32_t;

// Shape = sequence of sizes (one per dimension).
using Shape = std::vector<DSize>;

} // namespace rnexecutorch::core
