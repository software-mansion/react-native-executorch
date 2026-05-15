import { RnExecutorchErrorCode } from './ErrorCodes';

/**
 * Default user-facing message for error codes that are thrown verbatim from
 * multiple call sites. When a code is listed here, the `message` argument to
 * {@link RnExecutorchError} can be omitted.
 */
const DefaultErrorMessages: { [code: number]: string } = {
  [RnExecutorchErrorCode.DownloadInterrupted]:
    'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.',
  [RnExecutorchErrorCode.ModelGenerating]:
    'The model is currently generating. Please wait until previous model run is complete.',
  [RnExecutorchErrorCode.ModuleNotLoaded]:
    'The model is currently not loaded. Please load the model before calling forward().',
};

/**
 * Custom error class for React Native ExecuTorch errors.
 */
export class RnExecutorchError extends Error {
  /**
   * The error code representing the type of error.
   *
   * Typed as `RnExecutorchErrorCode | number` because codes are defined in
   * `scripts/errors.config.ts` and generated into both the C++ and the TS
   * sources. If those generated files drift, a code emitted on one side may
   * not exist in the enum on the other and flows through as a raw number.
   * Consumers switching on `code` should always include a `default` branch.
   */
  public code: RnExecutorchErrorCode | number;

  /**
   * The original cause of the error, if any.
   */
  public cause?: unknown;

  constructor(
    code: RnExecutorchErrorCode | number,
    message?: string,
    cause?: unknown
  ) {
    const resolved =
      message ??
      DefaultErrorMessages[code] ??
      `RnExecutorch error: ${RnExecutorchErrorCode[code] ?? `code ${code}`}`;
    super(resolved);
    this.code = code;
    this.message = resolved;
    this.cause = cause;
  }
}

function isRnExecutorchErrorLike(
  e: unknown
): e is { code: number; message: string } {
  const candidate = e as Record<string, unknown>;

  return (
    typeof e === 'object' &&
    e !== null &&
    typeof candidate.code === 'number' &&
    typeof candidate.message === 'string'
  );
}

export function parseUnknownError(e: unknown): RnExecutorchError {
  if (e instanceof RnExecutorchError) {
    return e;
  }
  if (isRnExecutorchErrorLike(e)) {
    return new RnExecutorchError(e.code, e.message);
  }

  if (e instanceof Error) {
    return new RnExecutorchError(RnExecutorchErrorCode.Internal, e.message, e);
  }

  if (typeof e === 'string') {
    return new RnExecutorchError(RnExecutorchErrorCode.Internal, e);
  }

  return new RnExecutorchError(RnExecutorchErrorCode.Internal, String(e));
}
