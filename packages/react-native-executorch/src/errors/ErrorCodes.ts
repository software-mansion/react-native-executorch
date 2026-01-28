// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - Run 'yarn codegen:errors' to regenerate

export enum RnExecutorchErrorCode {
  /**
   * An umbrella-error that is thrown usually when something unexpected happens, for example a 3rd-party library error.
   */
  UnknownError = 101,
  /**
   * Thrown when a user tries to run a model that is not yet downloaded or loaded into memory.
   */
  ModuleNotLoaded = 102,
  /**
   * An error ocurred when saving a file. This could be, for instance a result image from an image model.
   */
  FileWriteFailed = 103,
  /**
   * Thrown when a user tries to run a model that is currently processing. It is only allowed to run a single model prediction at a time.
   */
  ModelGenerating = 104,
  /**
   * Thrown when a language is passed to a multi-language model that is not supported. For example OCR or Speech To Text.
   */
  LanguageNotSupported = 105,
  /**
   * Thrown when config parameters passed to a model are invalid. For example, when LLM's topp is outside of range [0, 1].
   */
  InvalidConfig = 112,
  /**
   * Thrown when the type of model source passed by the user is invalid.
   */
  InvalidModelSource = 255,
  /**
   * Thrown when the number of passed inputs to the model is different than the model metadata specifies.
   */
  UnexpectedNumInputs = 97,
  /**
   * Thrown when React Native ExecuTorch threadpool problem occurs.
   */
  ThreadPoolError = 113,
  /**
   * Thrown when a file read operation failed. This could be invalid image url passed to image models, or unsupported format.
   */
  FileReadFailed = 114,
  /**
   * Thrown when the size of model output is unexpected.
   */
  InvalidModelOutput = 115,
  /**
   * Thrown when the dimensions of input tensors don't match the model's expected dimensions.
   */
  WrongDimensions = 116,
  /**
   * Thrown when the input passed to our APIs is invalid, for example when passing an empty message aray to LLM's generate().
   */
  InvalidUserInput = 117,
  /**
   * Thrown when the number of downloaded files is unexpected, due to download interruptions.
   */
  DownloadInterrupted = 118,
  /**
   * Thrown when there's a configuration mismatch between multilingual and language settings in Speech-to-Text models.
   */
  MultilingualConfiguration = 160,
  /**
   * Thrown when streaming transcription is attempted but audio data chunk is missing.
   */
  MissingDataChunk = 161,
  /**
   * Thrown when trying to stop or insert data into a stream that hasn't been started.
   */
  StreamingNotStarted = 162,
  /**
   * Thrown when trying to start a new streaming session while another is already in progress.
   */
  StreamingInProgress = 163,
  /**
   * Thrown when a resource fails to download. This could be due to invalid URL, or for example a network problem.
   */
  ResourceFetcherDownloadFailed = 180,
  /**
   * Thrown when a user tries to trigger a download that's already in progress.
   */
  ResourceFetcherDownloadInProgress = 181,
  /**
   * Thrown when trying to pause a download that is already paused.
   */
  ResourceFetcherAlreadyPaused = 182,
  /**
   * Thrown when trying to resume a download that is already ongoing.
   */
  ResourceFetcherAlreadyOngoing = 183,
  /**
   * Thrown when trying to pause, resume, or cancel a download that is not active.
   */
  ResourceFetcherNotActive = 184,
  /**
   * Thrown when required URI information is missing for a download operation.
   */
  ResourceFetcherMissingUri = 185,
  /**
   * Status indicating a successful operation.
   */
  Ok = 0,
  /**
   * An internal error occurred.
   */
  Internal = 1,
  /**
   * Status indicating the executor is in an invalid state for a targeted operation.
   */
  InvalidState = 2,
  /**
   * Status indicating there are no more steps of execution to run
   */
  EndOfMethod = 3,
  /**
   * Operation is not supported in the current context.
   */
  NotSupported = 16,
  /**
   * Operation is not yet implemented.
   */
  NotImplemented = 17,
  /**
   * User provided an invalid argument.
   */
  InvalidArgument = 18,
  /**
   * Object is an invalid type for the operation.
   */
  InvalidType = 19,
  /**
   * Operator(s) missing in the operator registry.
   */
  OperatorMissing = 20,
  /**
   * Requested resource could not be found.
   */
  NotFound = 32,
  /**
   * Could not allocate the requested memory.
   */
  MemoryAllocationFailed = 33,
  /**
   * Could not access a resource.
   */
  AccessFailed = 34,
  /**
   * Error caused by the contents of a program.
   */
  InvalidProgram = 35,
  /**
   * Error caused by the contents of external data.
   */
  InvalidExternalData = 36,
  /**
   * Does not have enough resources to perform the requested operation.
   */
  OutOfResources = 37,
  /**
   * Init stage: Backend receives an incompatible delegate version.
   */
  DelegateInvalidCompatibility = 48,
  /**
   * Init stage: Backend fails to allocate memory.
   */
  DelegateMemoryAllocationFailed = 49,
  /**
   * Execute stage: The handle is invalid.
   */
  DelegateInvalidHandle = 50,
}
