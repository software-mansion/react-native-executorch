/**
 * Errors raised by React Native ExecuTorch.
 *
 * This module is the source of truth for the error contract; `cpp/core/error.h`
 * mirrors it by hand, the same way the rest of the TS/JSI interface is mirrored.
 *
 * Errors are plain `Error` objects with extra fields rather than a class.
 * Worklet runtimes are separate JavaScript runtimes and a value thrown on one
 * does not keep its class identity or prototype chain when it travels to
 * another, so a class would only work on some of the paths that can throw.
 * @packageDocumentation
 */

/**
 * Every error code the library can raise.
 *
 * Deliberately coarse. A distinct code earns its place only when an app can
 * genuinely recover differently from it (retry a download, wait for a busy
 * resource, re-create a disposed one). Everything else is a category that
 * exists so crash reporters can group failures, and the detail lives in the
 * message.
 * @category Errors
 */
export const VALID_ERROR_CODES = [
  'LOAD_FAILED',
  'EXECUTION_FAILED',
  'SCHEMA_MISMATCH',
  'INVALID_ARGUMENT',
  'INVALID_STATE',
  'RESOURCE_DISPOSED',
  'RESOURCE_BUSY',
  'DOWNLOAD_FAILED',
  'DOWNLOAD_ABORTED',
  'UNKNOWN',
] as const;

/**
 * Machine-readable classification of an {@link RnExecuTorchError}. Branch on
 * this rather than on the message, which is written for humans and can be
 * reworded in any release.
 * @category Errors
 */
export type RnExecuTorchErrorCode = (typeof VALID_ERROR_CODES)[number];

/**
 * An error raised by React Native ExecuTorch: a standard `Error` carrying a
 * {@link RnExecuTorchErrorCode}.
 * @category Errors
 * @typeParam C The specific code, narrowed by {@link isRnExecuTorchError}.
 */
export type RnExecuTorchError<C extends RnExecuTorchErrorCode = RnExecuTorchErrorCode> = Error & {
  name: 'RnExecuTorchError';
  code: C;
  /**
   * The raw `executorch::runtime::Error` value when the failure came out of the
   * ExecuTorch runtime, absent otherwise. Diagnostic only: upstream's code space
   * moves independently of ours.
   */
  etRuntimeErrorCode?: number;
};

/**
 * Builds an {@link RnExecuTorchError}. Safe to call from anywhere, including
 * inside a worklet.
 * @category Errors
 * @param code The classification to attach.
 * @param message A human-readable description. Include the offending values.
 * @param etRuntimeErrorCode The raw ExecuTorch runtime error, when there is one.
 * @returns An `Error` carrying `code`.
 */
export function RnExecuTorchError<C extends RnExecuTorchErrorCode>(
  code: C,
  message: string,
  etRuntimeErrorCode?: number
): RnExecuTorchError<C> {
  'worklet';
  const err = new Error(message) as RnExecuTorchError<C>;
  err.name = 'RnExecuTorchError';
  err.code = code;

  if (etRuntimeErrorCode !== undefined) {
    err.etRuntimeErrorCode = etRuntimeErrorCode;
  }

  return err;
}

/**
 * Narrows an unknown caught value to an {@link RnExecuTorchError}, optionally
 * requiring a specific code.
 *
 * Duck-typed so it holds for errors that crossed a worklet or JSI boundary,
 * where class identity is gone.
 * @category Errors
 * @param err The caught value.
 * @param code When given, also requires the error to carry exactly this code.
 * @returns Whether `err` is an `RnExecuTorchError` (of code `code`, if given).
 * @example
 * ```typescript
 * try {
 *   await classifier.classify(image);
 * } catch (e) {
 *   if (isRnExecuTorchError(e, 'RESOURCE_BUSY')) return; // a run is in flight
 *   throw e;
 * }
 * ```
 */
export function isRnExecuTorchError<C extends RnExecuTorchErrorCode = RnExecuTorchErrorCode>(
  err: unknown,
  code?: C
): err is RnExecuTorchError<C> {
  'worklet';
  if (err === null || typeof err !== 'object') {
    return false;
  }
  if (!('name' in err) || err.name !== 'RnExecuTorchError') {
    return false;
  }
  if (!('code' in err) || typeof err.code !== 'string') {
    return false;
  }
  if (!(VALID_ERROR_CODES as readonly string[]).includes(err.code)) {
    return false;
  }
  return code === undefined || err.code === code;
}
