#pragma once

#include <chrono>
#include <string>

namespace rnexecutorch::fileutils {

inline std::string getTimeID() {
  return std::to_string(std::chrono::duration_cast<std::chrono::milliseconds>(
                            std::chrono::system_clock::now().time_since_epoch())
                            .count());
}

} // namespace rnexecutorch::fileutils
