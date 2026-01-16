#pragma once

#include <executorch/runtime/core/error.h>
#include <stdexcept>
#include <string>
#include <variant>

#include <rnexecutorch/ErrorCodes.h>

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
