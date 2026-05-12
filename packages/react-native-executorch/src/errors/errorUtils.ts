import { RnExecutorchErrorCode } from './ErrorCodes';

/**
 * Default user-facing message for error codes that are thrown verbatim from
 * multiple call sites. When a code is listed here, the `message` argument to
 * {@link RnExecutorchError} can be omitted.
 */
const DefaultErrorMessages: Partial<Record<RnExecutorchErrorCode, string>> = {
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
   */
  public code: RnExecutorchErrorCode;

  /**
   * The original cause of the error, if any.
   */
  public cause?: unknown;

  constructor(code: RnExecutorchErrorCode, message?: string, cause?: unknown) {
    const resolved =
      message ??
      DefaultErrorMessages[code] ??
      `RnExecutorch error (code ${code})`;
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
