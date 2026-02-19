// Single source of truth for error codes
// Run `yarn codegen:errors` to generate C++ and TypeScript enums

export const errorDefinitions = {
  // React-native-ExecuTorch errors
  /**
   * An umbrella-error that is thrown usually when something unexpected happens, for example a 3rd-party library error.
   */
  UnknownError: 0x65,
  /**
   * Thrown when a user tries to run a model that is not yet downloaded or loaded into memory.
   */
  ModuleNotLoaded: 0x66,
  /**
   * An error ocurred when saving a file. This could be, for instance a result image from an image model.
   */
  FileWriteFailed: 0x67,
  /**
   * Thrown when a user tries to run a model that is currently processing. It is only allowed to run a single model prediction at a time.
   */
  ModelGenerating: 0x68,
  /*
   * Thrown when a language is passed to a multi-language model that is not supported. For example OCR or Speech To Text.
   */
  LanguageNotSupported: 0x69,
  /*
   * Thrown when config parameters passed to a model are invalid. For example, when LLM's topp is outside of range [0, 1].
   */
  InvalidConfig: 0x70,
  /*
   * Thrown when the type of model source passed by the user is invalid.
   */
  InvalidModelSource: 0xff,
  /*
   * Thrown when the number of passed inputs to the model is different than the model metadata specifies.
   */
  UnexpectedNumInputs: 0x61,
  /*
   * Thrown when React Native ExecuTorch threadpool problem occurs.
   */
  ThreadPoolError: 0x71,
  /*
   * Thrown when a file read operation failed. This could be invalid image url passed to image models, or unsupported format.
   */
  FileReadFailed: 0x72,
  /*
   * Thrown when the size of model output is unexpected.
   */
  InvalidModelOutput: 0x73,
  /*
   * Thrown when the dimensions of input tensors don't match the model's expected dimensions.
   */
  WrongDimensions: 0x74,
  /*
   * Thrown when the input passed to our APIs is invalid, for example when passing an empty message array to LLM's generate().
   */
  InvalidUserInput: 0x75,
  /*
   * Thrown when the number of downloaded files is unexpected, due to download interruptions.
   */
  DownloadInterrupted: 0x76,

  /*
   * Thrown when an error occurs with the tokenizer or tokenization process.
   */
  TokenizerError: 0xa7,
  // INFO: SpeechToText errors
  /*
   * Thrown when there's a configuration mismatch between multilingual and language settings in Speech-to-Text models.
   */
  MultilingualConfiguration: 0xa0,
  /*
   * Thrown when streaming transcription is attempted but audio data chunk is missing.
   */
  MissingDataChunk: 0xa1,
  /*
   * Thrown when trying to stop or insert data into a stream that hasn't been started.
   */
  StreamingNotStarted: 0xa2,
  /*
   * Thrown when trying to start a new streaming session while another is already in progress.
   */
  StreamingInProgress: 0xa3,

  // INFO: Resource Fetcher Errors
  /**
   * Thrown when a resource fails to download. This could be due to invalid URL, or for example a network problem.
   */
  ResourceFetcherDownloadFailed: 0xb4,
  /**
   * Thrown when a user tries to trigger a download that's already in progress.
   */
  ResourceFetcherDownloadInProgress: 0xb5,
  /**
   * Thrown when trying to pause a download that is already paused.
   */
  ResourceFetcherAlreadyPaused: 0xb6,
  /**
   * Thrown when trying to resume a download that is already ongoing.
   */
  ResourceFetcherAlreadyOngoing: 0xb7,
  /**
   * Thrown when trying to pause, resume, or cancel a download that is not active.
   */
  ResourceFetcherNotActive: 0xb8,
  /**
   * Thrown when required URI information is missing for a download operation.
   */
  ResourceFetcherMissingUri: 0xb9,
  /**
   * Thrown when trying to load resources without fetcher initialization.
   */
  ResourceFetcherAdapterNotInitialized: 0xba,

  // ExecuTorch mapped errors
  // Based on: https://github.com/pytorch/executorch/blob/main/runtime/core/error.h

  // System errors
  /**
   * Status indicating a successful operation.
   */
  Ok: 0x00,
  /**
   * An internal error occurred.
   */
  Internal: 0x01,
  /**
   * Status indicating the executor is in an invalid state for a targeted operation.
   */
  InvalidState: 0x02,
  /**
   * Status indicating there are no more steps of execution to run
   */
  EndOfMethod: 0x03,

  // Logical errors
  /**
   * Operation is not supported in the current context.
   */
  NotSupported: 0x10,
  /**
   * Operation is not yet implemented.
   */
  NotImplemented: 0x11,
  /**
   * User provided an invalid argument.
   */
  InvalidArgument: 0x12,
  /**
   * Object is an invalid type for the operation.
   */
  InvalidType: 0x13,
  /**
   * Operator(s) missing in the operator registry.
   */
  OperatorMissing: 0x14,

  // Resource errors
  /**
   * Requested resource could not be found.
   */
  NotFound: 0x20,
  /**
   * Could not allocate the requested memory.
   */
  MemoryAllocationFailed: 0x21,
  /**
   * Could not access a resource.
   */
  AccessFailed: 0x22,
  /**
   * Error caused by the contents of a program.
   */
  InvalidProgram: 0x23,
  /**
   * Error caused by the contents of external data.
   */
  InvalidExternalData: 0x24,
  /**
   * Does not have enough resources to perform the requested operation.
   */
  OutOfResources: 0x25,

  // Delegate errors
  /**
   * Init stage: Backend receives an incompatible delegate version.
   */
  DelegateInvalidCompatibility: 0x30,
  /**
   * Init stage: Backend fails to allocate memory.
   */
  DelegateMemoryAllocationFailed: 0x31,
  /**
   * Execute stage: The handle is invalid.
   */
  DelegateInvalidHandle: 0x32,
} as const;

export type ErrorName = keyof typeof errorDefinitions;
