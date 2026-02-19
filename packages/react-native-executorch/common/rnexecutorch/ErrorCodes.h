#pragma once

// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - Run 'yarn codegen:errors' to regenerate

#include <cstdint>

namespace rnexecutorch {

enum class RnExecutorchErrorCode : int32_t {
  /**
   * An umbrella-error that is thrown usually when something unexpected happens,
   * for example a 3rd-party library error.
   */
  UnknownError = 101,
  /**
   * Thrown when a user tries to run a model that is not yet downloaded or
   * loaded into memory.
   */
  ModuleNotLoaded = 102,
  /**
   * An error ocurred when saving a file. This could be, for instance a result
   * image from an image model.
   */
  FileWriteFailed = 103,
  /**
   * Thrown when a user tries to run a model that is currently processing. It is
   * only allowed to run a single model prediction at a time.
   */
  ModelGenerating = 104,
  /**
   * Thrown when a language is passed to a multi-language model that is not
   * supported. For example OCR or Speech To Text.
   */
  LanguageNotSupported = 105,
  /**
   * Thrown when config parameters passed to a model are invalid. For example,
   * when LLM's topp is outside of range [0, 1].
   */
  InvalidConfig = 112,
  /**
   * Thrown when the type of model source passed by the user is invalid.
   */
  InvalidModelSource = 255,
  /**
   * Thrown when the number of passed inputs to the model is different than the
   * model metadata specifies.
   */
  UnexpectedNumInputs = 97,
  /**
   * Thrown when React Native ExecuTorch threadpool problem occurs.
   */
  ThreadPoolError = 113,
  /**
   * Thrown when a file read operation failed. This could be invalid image url
   * passed to image models, or unsupported format.
   */
  FileReadFailed = 114,
  /**
   * Thrown when the size of model output is unexpected.
   */
  InvalidModelOutput = 115,
  /**
   * Thrown when the dimensions of input tensors don't match the model's
   * expected dimensions.
   */
  WrongDimensions = 116,
  /**
   * Thrown when the input passed to our APIs is invalid, for example when
   * passing an empty message array to LLM's generate().
   */
  InvalidUserInput = 117,
  /**
   * Thrown when the number of downloaded files is unexpected, due to download
   * interruptions.
   */
  DownloadInterrupted = 118,
  /**
   * Thrown when an error occurs with the tokenizer or tokenization process.
   */
  TokenizerError = 167,
  /**
   * Thrown when there's a configuration mismatch between multilingual and
   * language settings in Speech-to-Text models.
   */
  MultilingualConfiguration = 160,
  /**
   * Thrown when streaming transcription is attempted but audio data chunk is
   * missing.
   */
  MissingDataChunk = 161,
  /**
   * Thrown when trying to stop or insert data into a stream that hasn't been
   * started.
   */
  StreamingNotStarted = 162,
  /**
   * Thrown when trying to start a new streaming session while another is
   * already in progress.
   */
  StreamingInProgress = 163,
  /**
   * Thrown when a resource fails to download. This could be due to invalid URL,
   * or for example a network problem.
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
   * Thrown when trying to pause, resume, or cancel a download that is not
   * active.
   */
  ResourceFetcherNotActive = 184,
  /**
   * Thrown when required URI information is missing for a download operation.
   */
  ResourceFetcherMissingUri = 185,
  /**
   * Thrown when trying to load resources without fetcher initialization.
   */
  ResourceFetcherAdapterNotInitialized = 186,
};

} // namespace rnexecutorch
