#pragma once

#include <executorch/runtime/core/error.h>
#include <source_location>
#include <stdexcept>
#include <string>
#include <string_view>
#include <variant>

#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch {

using ErrorVariant = std::variant<RnExecutorchErrorCode, executorch::runtime::Error>;

class RnExecutorchError : public std::runtime_error {
public:
  ErrorVariant errorCode;

  RnExecutorchError(ErrorVariant code, const std::string &message)
      : std::runtime_error(message), errorCode(code) {}

  int32_t getNumericCode() const noexcept {
    return std::visit([](auto &&arg) -> int32_t { return static_cast<int32_t>(arg); }, errorCode);
  }

  bool isRnExecutorchError() const noexcept {
    return std::holds_alternative<RnExecutorchErrorCode>(errorCode);
  }

  bool isExecuTorchRuntimeError() const noexcept {
    return std::holds_alternative<executorch::runtime::Error>(errorCode);
  }
};

namespace detail {

// npos + 1 wraps to 0, so the no-slash case returns the whole path.
constexpr std::string_view basename(std::string_view path) noexcept {
  return path.substr(path.find_last_of('/') + 1);
}

inline std::string locationPrefix(const std::source_location &loc) {
  return "[" + std::string(basename(loc.file_name())) + "] ";
}

[[noreturn]] inline void
throwNotLoaded(std::source_location loc = std::source_location::current()) {
  throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                          locationPrefix(loc) + "Model not loaded (in: " + loc.function_name() +
                              ")");
}

template <typename Result>
inline void checkOkOrThrowForwardError(const Result &result,
                                       std::source_location loc = std::source_location::current()) {
  if (!result.ok()) {
    throw RnExecutorchError(result.error(), locationPrefix(loc) +
                                                "Forward pass failed (in: " + loc.function_name() +
                                                "). Ensure the model input is correct.");
  }
}

} // namespace detail
} // namespace rnexecutorch

#define CHECK_OK_OR_THROW_FORWARD_ERROR(result)                                                    \
  ::rnexecutorch::detail::checkOkOrThrowForwardError(result)

#define THROW_NOT_LOADED_ERROR() ::rnexecutorch::detail::throwNotLoaded()
