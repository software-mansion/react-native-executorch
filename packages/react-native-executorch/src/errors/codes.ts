// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - run 'yarn codegen:errors' to regenerate

/**
 * Machine-readable classification of a {@link RnExecutorchError}.
 *
 * Branch on this rather than on the error message: messages are written for
 * humans and change freely between releases, codes do not.
 * @category Errors
 */
export enum RnExecutorchErrorCode {
  /**
   * Something failed in a way React Native ExecuTorch does not classify. Also
   * the code assigned to third-party and unrecognized throwables that reach the
   * library boundary. Not actionable programmatically — surface the message.
   */
  Internal = 1,
  /**
   * An argument passed to a public API is out of range, malformed, or
   * inconsistent with the other arguments. Fix the call site.
   */
  InvalidArgument = 2,
  /**
   * The operation is not valid in the current lifecycle state, for example
   * stopping a transcription stream that was never started. Sequence the calls
   * differently.
   */
  InvalidState = 3,
  /**
   * The requested feature, backend, platform, or language is unavailable in the
   * current environment. Fall back to a supported option.
   */
  NotSupported = 4,
  /**
   * Reading or writing a local file failed.
   */
  FileAccessFailed = 5,
  /**
   * The model file could not be loaded. Usually a corrupted or truncated
   * download, or a `.pte` exported for a runtime version this build does not
   * support. Carries the underlying ExecuTorch error in `etCode`.
   */
  ModelLoadFailed = 20,
  /**
   * The model was used after `dispose()`. The instance cannot be revived —
   * create a new one.
   */
  ModelDisposed = 21,
  /**
   * The model is already executing. Only one run at a time is allowed per
   * instance; wait for the in-flight run to settle or use a second instance.
   */
  ModelBusy = 22,
  /**
   * The loaded model's inputs, outputs, or method names do not match the
   * contract the task requires. Check the model against the documented I/O
   * contract for this task, or use the lower-level model API directly.
   */
  ModelSchemaMismatch = 23,
  /**
   * The ExecuTorch runtime failed while executing a method. Carries the
   * underlying ExecuTorch error in `etCode`.
   */
  ExecutionFailed = 24,
  /**
   * The tokenizer failed to load, encode, or decode.
   */
  TokenizerError = 25,
  /**
   * A resource could not be downloaded: network failure, HTTP error, or an
   * interrupted transfer. Retry, ideally with backoff.
   */
  DownloadFailed = 40,
  /**
   * A download was cancelled through its `AbortSignal`. Expected during normal
   * teardown; usually safe to ignore.
   */
  DownloadAborted = 41,
}
