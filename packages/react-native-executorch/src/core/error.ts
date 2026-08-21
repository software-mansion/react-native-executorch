/**
 * Classified error handling for React Native ExecuTorch.
 *
 * All errors raised by the library carry a machine-readable
 * {@link RnExecuTorchErrorCode} (e.g. `LOAD_FAILED`, `EXECUTION_FAILED`,
 * `RESOURCE_BUSY`, or `SCHEMA_MISMATCH`) allowing applications to inspect and
 * handle failures programmatically.
 *
 * Use {@link isRnExecuTorchError} to safely narrow caught errors across
 * asynchronous calls and worklet runtime boundaries.
 * @module Core/Error
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
 * An error raised by React Native ExecuTorch.
 *
 * Represents a standard `Error` augmented with a machine-readable
 * {@link RnExecuTorchErrorCode} and an optional ExecuTorch C++ runtime code
 * (`etRuntimeErrorCode`).
 *
 * When thrown, call as a factory function without `new` (safe across worklet
 * threads):
 * ```typescript
 * throw RnExecuTorchError('INVALID_ARGUMENT', 'Shape dimensions must be positive');
 * ```
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
 * Creates an {@link RnExecuTorchError} carrying a machine-readable code.
 * @category Errors
 * @typeParam C The specific error code.
 * @param code The classification to attach. See {@link RnExecuTorchErrorCode}.
 * @param message A human-readable description of the failure.
 * @param etRuntimeErrorCode The raw ExecuTorch runtime error, when available.
 * @returns An `Error` carrying `code` and `name: 'RnExecuTorchError'`.
 * @see {@link RnExecuTorchErrorCode}
 * @example
 * ```typescript
 * throw RnExecuTorchError('INVALID_ARGUMENT', 'Shape dimensions must be positive');
 * ```
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
