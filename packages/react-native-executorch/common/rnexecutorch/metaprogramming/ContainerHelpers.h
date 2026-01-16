#pragma once

#include <cstddef>
#include <filesystem>
#include <stdexcept>
#include <string>

#include <rnexecutorch/Log.h>

/**
 * @brief A helper macro to check if a container has the expected size.
 * Prints an error message with the container's name, file, and line number if
 * the size does not match, and throws a std::runtime_error.
 *
 * @param container The container whose size will be checked (must have a
 * .size() method).
 * @param expected The expected size of the container.
 * @note The macro prints the variable name, file, and line for easier
 * debugging.
 */
#define CHECK_SIZE(container, expected)                                        \
  if ((container).size() != (expected)) {                                      \
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,                          \
                      "Unexpected size for " #container " at ",                \
                      std::filesystem::path(__FILE__).filename().string(),     \
                      ":", __LINE__, ": expected ", (expected), " but got ",   \
                      (container).size());                                     \
    throw std::runtime_error("Invalid input shape for " #container);           \
  }