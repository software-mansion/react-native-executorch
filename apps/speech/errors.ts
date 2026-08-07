import { isRnExecutorchError, RnExecutorchErrorCode } from 'react-native-executorch';

/**
 * Turns anything thrown by react-native-executorch into a message worth putting
 * in front of a user.
 *
 * Branches on `error.code`, never on the message text: messages are written for
 * developers and change freely between releases, codes do not. Values that
 * aren't library errors (Skia, the image picker, ...) fall through to their own
 * message.
 * @param e The caught value.
 * @returns A user-facing description of `e`.
 */
export function describeError(e: unknown): string {
  if (!isRnExecutorchError(e)) {
    return e instanceof Error ? e.message : String(e);
  }

  switch (e.code) {
    case RnExecutorchErrorCode.DownloadFailed:
      return 'Download failed. Check your connection and try again.';
    case RnExecutorchErrorCode.DownloadAborted:
      return 'Download cancelled.';
    case RnExecutorchErrorCode.ResourceBusy:
      return 'Still busy with the previous run. Try again in a moment.';
    case RnExecutorchErrorCode.ResourceDisposed:
      return 'The model was released. Reopen this screen to load it again.';
    case RnExecutorchErrorCode.ModelLoadFailed:
      return 'The model could not be loaded. The file may be corrupted, try re-downloading it.';
    case RnExecutorchErrorCode.ModelSchemaMismatch:
      return `This model does not match what the task expects.\n${e.message}`;
    // Everything else is developer-facing (bad arguments, unsupported options,
    // internal failures): show it verbatim so it is obvious while building.
    // Codes are numeric and shared with the native side, so a `default` branch
    // is always required.
    default:
      return e.message;
  }
}

/**
 * True when the failure only means an operation was already in flight. The
 * caller can drop this attempt silently rather than surfacing anything.
 * @param e The caught value.
 * @returns Whether `e` is a busy-resource error.
 */
export function isBusyError(e: unknown): boolean {
  return isRnExecutorchError(e) && e.code === RnExecutorchErrorCode.ResourceBusy;
}

/**
 * True when the failure is just a model that was disposed out from under an
 * in-flight call — expected during teardown or a model switch, not worth
 * reporting.
 * @param e The caught value.
 * @returns Whether `e` is a disposed-resource error.
 */
export function isDisposedError(e: unknown): boolean {
  return isRnExecutorchError(e) && e.code === RnExecutorchErrorCode.ResourceDisposed;
}
