import { ETErrorCode } from './ErrorCodes';

export class ExecutorchError extends Error {
  public code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.message = message;
  }
}

export function parseUnknownError(e: unknown): ExecutorchError {
  if (e instanceof ExecutorchError) {
    return e;
  }
  if (e instanceof Error) {
    // TODO: Fix this code
    return new ExecutorchError(ETErrorCode.Internal, e.message);
  }
  if (typeof e === 'string') {
    return new ExecutorchError(ETErrorCode.Internal, e);
  }
  return new ExecutorchError(ETErrorCode.Internal, String(e));
}
