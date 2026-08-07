// Single source of truth for React Native ExecuTorch error codes.
// Run `yarn codegen:errors` to regenerate the C++ and TypeScript enums.
//
// Adding a code
// -------------
// A code exists so a caller can branch on it. Before adding one, ask: would an
// app plausibly write a different `catch` branch for this than for every code
// already listed? If not, it is a *message*, not a code — pass the detail in
// the message instead.
//
// Numeric values are part of the public API: they are what crosses the JSI and
// worklet boundaries. Never renumber or reuse a value; append new codes at the
// end of the relevant block.
//
// Errors originating in the ExecuTorch runtime are *not* mirrored here. They
// keep their own numbering and travel alongside an RNE code in the separate
// `etCode` field, so the two code spaces stay independent.

export const errorDefinitions = {
  // =========================================================================
  // General (1–19)
  // =========================================================================
  /**
   * Something failed in a way React Native ExecuTorch does not classify. Also
   * the code assigned to third-party and unrecognized throwables that reach the
   * library boundary. Not actionable programmatically — surface the message.
   */
  Internal: 1,
  /**
   * An argument passed to a public API is out of range, malformed, or
   * inconsistent with the other arguments. Fix the call site.
   */
  InvalidArgument: 2,
  /**
   * The operation is not valid in the current lifecycle state, for example
   * stopping a transcription stream that was never started. Sequence the calls
   * differently.
   */
  InvalidState: 3,
  /**
   * The requested feature, backend, platform, or language is unavailable in the
   * current environment. Fall back to a supported option.
   */
  NotSupported: 4,
  /**
   * Reading or writing a local file failed.
   */
  FileAccessFailed: 5,

  // =========================================================================
  // Model lifecycle and execution (20–39)
  // =========================================================================
  /**
   * The model file could not be loaded. Usually a corrupted or truncated
   * download, or a `.pte` exported for a runtime version this build does not
   * support. Carries the underlying ExecuTorch error in `etCode`.
   */
  ModelLoadFailed: 20,
  /**
   * A model, tensor, or tokenizer was used after `dispose()`. The instance
   * cannot be revived — create a new one.
   */
  ResourceDisposed: 21,
  /**
   * The model, tensor, or tokenizer is already in use by another operation.
   * Only one at a time is allowed per instance; wait for the in-flight
   * operation to settle or use a second instance.
   */
  ResourceBusy: 22,
  /**
   * The loaded model's inputs, outputs, or method names do not match the
   * contract the task requires. Check the model against the documented I/O
   * contract for this task, or use the lower-level model API directly.
   */
  ModelSchemaMismatch: 23,
  /**
   * The ExecuTorch runtime failed while executing a method. Carries the
   * underlying ExecuTorch error in `etCode`.
   */
  ExecutionFailed: 24,
  /**
   * The tokenizer failed to load, encode, or decode.
   */
  TokenizerError: 25,

  // =========================================================================
  // Resource fetching (40–59)
  // =========================================================================
  /**
   * A resource could not be downloaded: network failure, HTTP error, or an
   * interrupted transfer. Retry, ideally with backoff.
   */
  DownloadFailed: 40,
  /**
   * A download was cancelled through its `AbortSignal`. Expected during normal
   * teardown; usually safe to ignore.
   */
  DownloadAborted: 41,
} as const;

export type ErrorName = keyof typeof errorDefinitions;
