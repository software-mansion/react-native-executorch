#pragma once

#include <cstdint>
#include <functional>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>

#include <executorch/runtime/core/error.h>
#include <jsi/jsi.h>

namespace rnexecutorch::core::error {
namespace jsi = facebook::jsi;

/**
 * Mirrors the `RnExecuTorchErrorCode` union in `src/core/error.ts`, which is the
 * source of truth. Keep the two in sync by hand, the same way the rest of the
 * TS/JSI interface is mirrored.
 */
enum class RnExecuTorchErrorCode {
    LoadFailed,
    ExecutionFailed,
    SchemaMismatch,
    InvalidArgument,
    InvalidState,
    ResourceDisposed,
    ResourceBusy,
    DownloadFailed,
    DownloadAborted,
    Unknown
};

constexpr const char *errorCodeToString(RnExecuTorchErrorCode code) {
    switch (code) {
    case RnExecuTorchErrorCode::LoadFailed:
        return "LOAD_FAILED";
    case RnExecuTorchErrorCode::ExecutionFailed:
        return "EXECUTION_FAILED";
    case RnExecuTorchErrorCode::SchemaMismatch:
        return "SCHEMA_MISMATCH";
    case RnExecuTorchErrorCode::InvalidArgument:
        return "INVALID_ARGUMENT";
    case RnExecuTorchErrorCode::InvalidState:
        return "INVALID_STATE";
    case RnExecuTorchErrorCode::ResourceDisposed:
        return "RESOURCE_DISPOSED";
    case RnExecuTorchErrorCode::ResourceBusy:
        return "RESOURCE_BUSY";
    case RnExecuTorchErrorCode::DownloadFailed:
        return "DOWNLOAD_FAILED";
    case RnExecuTorchErrorCode::DownloadAborted:
        return "DOWNLOAD_ABORTED";
    default:
        return "UNKNOWN";
    }
}

/**
 * The exception every failure in the native layer is raised as.
 *
 * Native code never throws a jsi::JSError directly. `guarded` is the only place
 * that turns an exception into a JavaScript value, so a code can never be lost
 * on the way out.
 */
class RnExecuTorchException : public std::runtime_error {
public:
    explicit RnExecuTorchException(RnExecuTorchErrorCode code, const std::string &message)
        : std::runtime_error(message), code_(code) {}

    explicit RnExecuTorchException(RnExecuTorchErrorCode code, const std::string &message,
                                   executorch::runtime::Error etError)
        : std::runtime_error(message), code_(code),
          etRuntimeErrorCode_(static_cast<int32_t>(etError)) {}

    RnExecuTorchErrorCode code_;
    /**
     * The originating executorch::runtime::Error, when the failure came out of
     * the ExecuTorch runtime. Kept apart from `code_` so upstream's numbering
     * stays independent of ours.
     */
    std::optional<int32_t> etRuntimeErrorCode_;
};

/**
 * Throws `e` into JavaScript as an Error carrying `name`, `code`, and (when the
 * failure came from the ExecuTorch runtime) `etRuntimeErrorCode`. These are the
 * fields `isRnExecuTorchError` on the TypeScript side reads.
 */
[[noreturn]] void throwJsiRnExecuTorchError(jsi::Runtime &rt, const RnExecuTorchException &e);

/**
 * Runs `fn`, translating anything it throws into a coded JavaScript Error.
 */
template <typename Fn>
auto guard(jsi::Runtime &rt, Fn &&fn) -> decltype(fn()) {
    try {
        return std::forward<Fn>(fn)();
    } catch (const RnExecuTorchException &e) {
        throwJsiRnExecuTorchError(rt, e);
    } catch (const jsi::JSError &) {
        // Already a JavaScript value, and possibly one thrown by user code
        // called back into. Pass it through untouched.
        throw;
    } catch (const std::exception &e) {
        throwJsiRnExecuTorchError(rt, RnExecuTorchException(RnExecuTorchErrorCode::Unknown, e.what()));
    } catch (...) {
        throwJsiRnExecuTorchError(
            rt, RnExecuTorchException(RnExecuTorchErrorCode::Unknown, "Unknown native exception occurred"));
    }
}

/**
 * Wraps a JSI host function so that anything thrown inside it, including an
 * RnExecuTorchException raised deeper in the native stack, reaches JavaScript
 * as a coded Error.
 *
 * Apply this at every `createFromHostFunction` call site. Doing it here rather
 * than inside each body keeps the guarantee in one place: a body that forgets
 * to catch cannot silently drop a code.
 */
inline jsi::HostFunctionType guarded(jsi::HostFunctionType fn) {
    return [fn = std::move(fn)](jsi::Runtime &rt, const jsi::Value &thisVal,
                                const jsi::Value *args, size_t count) -> jsi::Value {
        return guard(rt, [&] { return fn(rt, thisVal, args, count); });
    };
}

} // namespace rnexecutorch::core::error
