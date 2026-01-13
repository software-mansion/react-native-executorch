import { ETErrorCode } from './ErrorCodes';

export class ExecutorchError extends Error {
  public code: ETErrorCode;
  public cause?: unknown;

  constructor(code: number, message: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.message = message;
    this.cause = cause;
  }
}

export function parseUnknownError(e: unknown): ExecutorchError {
  if (e instanceof ExecutorchError) {
    return e;
  }

  if (e instanceof Error) {
    return new ExecutorchError(ETErrorCode.Internal, e.message, e);
  }

  if (typeof e === 'string') {
    return new ExecutorchError(ETErrorCode.Internal, e);
  }

  return new ExecutorchError(ETErrorCode.Internal, String(e));
}
