import { RnExecutorchErrorCode } from './ErrorCodes';

export class RnExecutorchError extends Error {
  public code: RnExecutorchErrorCode;
  public cause?: unknown;

  constructor(code: number, message: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.message = message;
    this.cause = cause;
  }
}

export function parseUnknownError(e: unknown): RnExecutorchError {
  if (e instanceof RnExecutorchError) {
    return e;
  }

  if (e instanceof Error) {
    return new RnExecutorchError(RnExecutorchErrorCode.Internal, e.message, e);
  }

  if (typeof e === 'string') {
    return new RnExecutorchError(RnExecutorchErrorCode.Internal, e);
  }

  return new RnExecutorchError(RnExecutorchErrorCode.Internal, String(e));
}
