#pragma once

#include <executorch/runtime/core/error.h>
#include <stdexcept>
#include <string>
#include <variant>

#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch::detail {
constexpr const char *basename(const char *path) noexcept {
  const char *base = path;
  while (*path) {
    if (*path++ == '/')
      base = path;
  }
  return base;
}
} // namespace rnexecutorch::detail

// clang-format off
#define CHECK_OK_OR_THROW_FORWARD_ERROR(result) \
  if (!(result).ok()) \
    throw RnExecutorchError( \
        (result).error(), std::string("[") + ::rnexecutorch::detail::basename(__FILE__) + \
        "] Forward pass failed (in: " + __func__ + "). Ensure the model input is correct.")

#define THROW_NOT_LOADED_ERROR() \
  throw RnExecutorchError( \
      RnExecutorchErrorCode::ModuleNotLoaded, \
      std::string("[") + ::rnexecutorch::detail::basename(__FILE__) + \
      "] Model not loaded (in: " + __func__ + ")")
// clang-format on

namespace rnexecutorch {

using ErrorVariant =
    std::variant<RnExecutorchErrorCode, executorch::runtime::Error>;

class RnExecutorchError : public std::runtime_error {
public:
  ErrorVariant errorCode;

  RnExecutorchError(ErrorVariant code, const std::string &message)
      : std::runtime_error(message), errorCode(code) {}

  int32_t getNumericCode() const noexcept {
    return std::visit(
        [](auto &&arg) -> int32_t { return static_cast<int32_t>(arg); },
        errorCode);
  }

  bool isRnExecutorchError() const noexcept {
    return std::holds_alternative<RnExecutorchErrorCode>(errorCode);
  }

  bool isExecuTorchRuntimeError() const noexcept {
    return std::holds_alternative<executorch::runtime::Error>(errorCode);
  }
};

} // namespace rnexecutorch
