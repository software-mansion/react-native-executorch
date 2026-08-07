#pragma once

#include <cstdint>
#include <format>
#include <functional>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>

#include <executorch/runtime/core/error.h>
#include <executorch/runtime/core/result.h>
#include <jsi/jsi.h>

#include "error_codes.h"

namespace rnexecutorch::core::error {
namespace jsi = facebook::jsi;

/**
 * An exception carrying a machine-readable ErrorCode.
 *
 * Thrown by the layers that have no jsi::Runtime to hand (constructors, helpers,
 * worker threads). `guard` turns it into a coded JavaScript Error at the JSI
 * boundary, so the code survives all the way to the application's catch block.
 */
class CodedError : public std::runtime_error {
public:
    explicit CodedError(ErrorCode code, const std::string &message)
        : std::runtime_error(message), code(code) {}

    explicit CodedError(ErrorCode code, const std::string &message, executorch::runtime::Error etError)
        : std::runtime_error(message), code(code), etCode(static_cast<int32_t>(etError)) {}

    ErrorCode code;
    /**
     * The originating executorch::runtime::Error, when the failure came out of
     * the ExecuTorch runtime. Kept apart from `code` so upstream's numbering
     * stays independent of ours.
     */
    std::optional<int32_t> etCode;
};

/**
 * Builds a JavaScript `Error` with `code` (and `etCode`) properties attached.
 *
 * These are the fields `toRnExecutorchError` on the TypeScript side reads to
 * rebuild an `RnExecutorchError`. A plain object shape is used rather than a
 * host object so the error survives being passed between worklet runtimes.
 */
jsi::Value makeJsError(jsi::Runtime &rt, ErrorCode code, const std::string &message,
                       std::optional<int32_t> etCode = std::nullopt);

/**
 * Throws a coded JavaScript Error. Use from inside a JSI host function.
 */
[[noreturn]] void throwJs(jsi::Runtime &rt, ErrorCode code, const std::string &message,
                          std::optional<int32_t> etCode = std::nullopt);

/**
 * Runs `fn`, translating anything it throws into a coded JavaScript Error.
 *
 * Wrap every JSI host function body in this: without it a `CodedError` raised
 * deeper in the native stack would reach JavaScript as an uncoded `Error`, or
 * as a hard crash for exception types JSI does not handle.
 */
template <typename Fn>
auto guard(jsi::Runtime &rt, Fn &&fn) -> decltype(fn()) {
    try {
        return std::forward<Fn>(fn)();
    } catch (const CodedError &e) {
        throw jsi::JSError(rt, makeJsError(rt, e.code, e.what(), e.etCode));
    } catch (const jsi::JSError &) {
        // Already a JavaScript value, and possibly one thrown by user code
        // called back into. Pass it through untouched.
        throw;
    } catch (const std::exception &e) {
        throw jsi::JSError(rt, makeJsError(rt, ErrorCode::Internal, e.what()));
    } catch (...) {
        throw jsi::JSError(rt, makeJsError(rt, ErrorCode::Internal, "Unknown native error"));
    }
}

/**
 * Wraps a JSI host function so that anything thrown inside it — including a
 * CodedError raised deeper in the native stack — reaches JavaScript as a coded
 * Error.
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

/**
 * Unwraps an ExecuTorch Result, throwing a CodedError that carries both our
 * `code` and the underlying ExecuTorch error when it failed.
 *
 * @param code The RNE classification to report the failure as.
 * @param ctx A short prefix naming the operation, e.g. "loadModel".
 */
template <typename T>
T unwrapEt(ErrorCode code, const std::string &ctx, executorch::runtime::Result<T> result) {
    if (!result.ok()) {
        throw CodedError(code,
                         std::format("{}: {}", ctx, executorch::runtime::to_string(result.error())),
                         result.error());
    }
    return std::move(result.get());
}

} // namespace rnexecutorch::core::error
