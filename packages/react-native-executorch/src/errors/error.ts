import { RnExecutorchErrorCode } from './codes';

/**
 * The plain-data form of a React Native ExecuTorch error.
 *
 * Worklet runtimes are separate JavaScript runtimes: a value thrown on one does
 * not keep its class identity, prototype chain, or stack when it travels to
 * another. Only this shape is guaranteed to survive the crossing, so it is what
 * the library throws inside worklets and what native code attaches to the
 * errors it raises.
 * @category Errors
 */
export interface RnExecutorchErrorLike {
  /** Machine-readable classification. Branch on this. */
  code: RnExecutorchErrorCode;
  /** Human-readable description. Do not match on this — it is not stable. */
  message: string;
  /**
   * The raw `executorch::runtime::Error` value when the failure came out of the
   * ExecuTorch runtime, absent otherwise. Diagnostic only: the ExecuTorch code
   * space is upstream's and moves independently of {@link
   * RnExecutorchErrorCode}.
   */
  etCode?: number;
}

/**
 * Error thrown by React Native ExecuTorch's asynchronous APIs.
 *
 * Prefer {@link isRnExecutorchError} over `instanceof` when catching. Both work
 * for errors surfaced by `async` APIs and hooks, but only the former also works
 * inside worklets (VisionCamera frame processors, anything called through
 * {@link wrapAsync}'s worklet), where an error cannot carry its class across the
 * runtime boundary.
 * @category Errors
 * @example
 * ```typescript
 * try {
 *   await classifier.classify(image);
 * } catch (e) {
 *   if (isRnExecutorchError(e) && e.code === RnExecutorchErrorCode.ModelBusy) {
 *     return; // a run is already in flight, drop this frame
 *   }
 *   throw e;
 * }
 * ```
 */
export class RnExecutorchError extends Error implements RnExecutorchErrorLike {
  readonly code: RnExecutorchErrorCode;
  readonly etCode?: number;

  constructor(
    code: RnExecutorchErrorCode,
    message: string,
    options?: { cause?: unknown; etCode?: number }
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    // Without an explicit name the class inherits `'Error'`, which makes crash
    // reporters group every library failure together with unrelated ones.
    this.name = 'RnExecutorchError';
    this.code = code;
    if (options?.etCode !== undefined) this.etCode = options.etCode;
    // Extending a built-in loses the prototype link when the class is
    // transpiled below ES6. Restore it so `instanceof` holds regardless of the
    // consumer's build target. `new.target` rather than a hardcoded
    // `RnExecutorchError.prototype`, so subclasses (e.g. `AbortError`) stay
    // `instanceof` themselves.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Narrows an unknown caught value to something carrying a React Native
 * ExecuTorch error code.
 *
 * Duck-typed on purpose, so it holds for both a real {@link RnExecutorchError}
 * and the plain-data form that crosses a worklet or JSI boundary. This is the
 * recommended way to catch library errors.
 * @category Errors
 * @param e The caught value.
 * @returns Whether `e` carries a React Native ExecuTorch error code.
 */
export function isRnExecutorchError(e: unknown): e is RnExecutorchErrorLike {
  'worklet';
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as RnExecutorchErrorLike).code === 'number' &&
    typeof (e as RnExecutorchErrorLike).message === 'string'
  );
}

/**
 * Builds a coded error that is safe to throw from anywhere, including inside a
 * worklet.
 *
 * Returns a plain `Error` with {@link RnExecutorchErrorLike}'s fields attached
 * rather than an {@link RnExecutorchError} instance: constructing a class
 * instance inside a worklet runtime would not survive the trip back to the
 * React Native runtime anyway. {@link toRnExecutorchError} upgrades it once it
 * is back on the RN runtime.
 * @category Errors
 * @param code The classification to attach.
 * @param message A human-readable description. Include the offending values.
 * @param etCode The raw ExecuTorch runtime error, when there is one.
 * @returns An `Error` carrying `code` (and `etCode`).
 */
export function rnExecutorchError(
  code: RnExecutorchErrorCode,
  message: string,
  etCode?: number
): Error & RnExecutorchErrorLike {
  'worklet';
  const e = new Error(message) as Error & { code: RnExecutorchErrorCode; etCode?: number };
  e.name = 'RnExecutorchError';
  e.code = code;
  if (etCode !== undefined) e.etCode = etCode;
  return e;
}

/**
 * Normalizes any caught value into an {@link RnExecutorchError}.
 *
 * Call this at the boundary where errors surface to application code — after a
 * worklet result comes back, or in a hook's `catch`. Values that already carry
 * a code keep it; everything else (third-party throwables, strings, rejected
 * built-ins) becomes {@link RnExecutorchErrorCode.Internal} with the original
 * preserved as `cause`.
 * @category Errors
 * @param e The caught value.
 * @returns An `RnExecutorchError` describing `e`.
 */
export function toRnExecutorchError(e: unknown): RnExecutorchError {
  if (e instanceof RnExecutorchError) return e;

  if (isRnExecutorchError(e)) {
    const error = new RnExecutorchError(e.code, e.message, {
      cause: e,
      etCode: e.etCode,
    });
    // Keep the original name so callers matching the standard `AbortSignal`
    // contract on `error.name === 'AbortError'` still work after normalization.
    if (e instanceof Error) error.name = e.name;
    return error;
  }

  if (e instanceof Error) {
    return new RnExecutorchError(RnExecutorchErrorCode.Internal, e.message, { cause: e });
  }

  return new RnExecutorchError(RnExecutorchErrorCode.Internal, String(e), { cause: e });
}
