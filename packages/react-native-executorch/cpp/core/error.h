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
 * The single list of error codes, mirroring the `RnExecuTorchErrorCode` union
 * in `src/core/error.ts`, which is the source of truth. Keep the two in sync by
 * hand, the same way the rest of the TS/JSI interface is mirrored.
 *
 * Adding a code here is all it takes: the enum, the string mapping, and the
 * factory functions below are all expanded from this one list, so they cannot
 * drift apart.
 */
// NOLINTNEXTLINE(cppcoreguidelines-macro-usage): X-macro keeps the enum, the string mapping, and the factories from drifting
#define FOR_ALL_RNEXECUTORCH_ERROR_CODES(V)  \
    V(LoadFailed, "LOAD_FAILED")             \
    V(ExecutionFailed, "EXECUTION_FAILED")   \
    V(SchemaMismatch, "SCHEMA_MISMATCH")     \
    V(InvalidArgument, "INVALID_ARGUMENT")   \
    V(InvalidState, "INVALID_STATE")         \
    V(ResourceDisposed, "RESOURCE_DISPOSED") \
    V(ResourceBusy, "RESOURCE_BUSY")         \
    V(DownloadFailed, "DOWNLOAD_FAILED")     \
    V(DownloadAborted, "DOWNLOAD_ABORTED")   \
    V(Unknown, "UNKNOWN")

enum class RnExecuTorchErrorCode {
// NOLINTNEXTLINE(cppcoreguidelines-macro-usage): helper macro for X-macro expansion
#define DEFINE_ENUM(name, str) name,
    FOR_ALL_RNEXECUTORCH_ERROR_CODES(DEFINE_ENUM)
#undef DEFINE_ENUM
};

/**
 * Maps a code to the string the JavaScript side matches on. Every enumerator is
 * cased, so an unmapped code cannot silently reach JS as "UNKNOWN".
 */
constexpr const char *errorCodeToString(RnExecuTorchErrorCode code) {
    switch (code) {
// NOLINTNEXTLINE(cppcoreguidelines-macro-usage): helper macro for X-macro expansion
#define DEFINE_CASE(name, str)        \
    case RnExecuTorchErrorCode::name: \
        return str;
        FOR_ALL_RNEXECUTORCH_ERROR_CODES(DEFINE_CASE)
#undef DEFINE_CASE
    }
    return "UNKNOWN";
}

/**
 * The exception every failure in the native layer is raised as.
 *
 * Native code never throws a jsi::JSError directly. `guarded` is the only place
 * that turns an exception into a JavaScript value, so a code can never be lost
 * on the way out.
 *
 * Prefer the factory functions below (`error::InvalidArgument(...)`) over
 * naming the constructor at a throw site.
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
 * One factory per code, so a throw site reads `throw error::InvalidArgument(msg)`
 * instead of naming both the exception and the enum. Pass `etError` only when
 * the failure actually came out of the ExecuTorch runtime.
 */
// NOLINTNEXTLINE(cppcoreguidelines-macro-usage): helper macro for X-macro expansion
#define DEFINE_FACTORY(name, str)                                                                         \
    inline RnExecuTorchException name(const std::string &message,                                         \
                                      std::optional<executorch::runtime::Error> etError = std::nullopt) { \
        return etError ? RnExecuTorchException(RnExecuTorchErrorCode::name, message, *etError)            \
                       : RnExecuTorchException(RnExecuTorchErrorCode::name, message);                     \
    }
FOR_ALL_RNEXECUTORCH_ERROR_CODES(DEFINE_FACTORY)
#undef DEFINE_FACTORY

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
        throwJsiRnExecuTorchError(rt, Unknown(e.what()));
    } catch (...) {
        throwJsiRnExecuTorchError(rt, Unknown("Unknown native exception occurred"));
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
