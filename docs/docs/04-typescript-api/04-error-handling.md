---
title: Error handling
---

## Overview

In order to handle different types of errors, you can use `instanceof` with our exported class `RnExecutorchError` and its `code` property. This allows you to check what exactly went wrong and act accordingly.

This example uses the `LLMModule`, and then tries to change its `generationConfig`. As the topp param has to be a value between 0 and 1 (inclusive), the `.configure()` method will throw an error with a code InvalidConfig.

```typescript
import {
  LLMModule,
  LLAMA3_2_1B_QLORA,
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';

const llm = new LLMModule({
  tokenCallback: (token) => console.log(token),
  messageHistoryCallback: (messages) => console.log(messages),
});

await llm.load(LLAMA3_2_1B_QLORA, (progress) => console.log(progress));

// Try to set an invalid configuration
try {
  await llm.configure({ topp: 1.5 }); // This will throw InvalidConfig error
} catch (err) {
  if (
    err instanceof RnExecutorchError &&
    err.code === RnExecutorchErrorCode.InvalidConfig
  ) {
    console.error('Invalid configuration:', err.message);
    // Handle the invalid config - set default values
    await llm.configure({ topp: 0.9 });
  } else {
    throw err;
  }
}

// Running the model
try {
  await llm.sendMessage('Hello, World!');
} catch (err) {
  if (err instanceof RnExecutorchError) {
    if (err.code === RnExecutorchErrorCode.ModuleNotLoaded) {
      console.error('Model not loaded:', err.message);
      // Load the model first
    } else if (err.code === RnExecutorchErrorCode.ModelGenerating) {
      console.error('Model is already generating:', err.message);
      // Wait for current generation to complete
    } else {
      console.error('Generation error:', err.message);
      throw err;
    }
  } else {
    throw err;
  }
}

// Interrupting the model (to actually interrupt the generation it has to be called when sendMessage or generate is running)
llm.interrupt();

// Deleting the model from memory
llm.delete();
```

## Reference

All errors in React Native ExecuTorch inherit from `RnExecutorchError` and include a `code` property from the `RnExecutorchErrorCode` enum. Below is a comprehensive list of all possible errors, organized by category.

### Module State Errors

These errors occur when trying to perform operations on a model in an invalid state.

| Error Code        | Description                           | When It Occurs                                                                        | How to Handle                                                              |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ModuleNotLoaded` | Model is not loaded into memory       | Calling `forward()`, `generate()`, or other inference methods before calling `load()` | Load the model first with `load()`                                         |
| `ModelGenerating` | Model is already processing a request | Calling `generate()` or `forward()` while another inference is running                | Wait for current generation to complete, or use `interrupt()` to cancel it |

### Configuration Errors

These errors occur when invalid configuration or input is provided.

| Error Code             | Description                          | When It Occurs                                                            | How to Handle                                        |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `InvalidConfig`        | Configuration parameters are invalid | Setting parameters outside valid ranges (e.g., `topp` outside [0, 1])     | Check parameter constraints and provide valid values |
| `InvalidUserInput`     | Input provided to API is invalid     | Passing empty arrays, null values, or malformed data to methods           | Validate input before calling methods                |
| `InvalidModelSource`   | Model source type is invalid         | Providing wrong type for model source (e.g., object when string expected) | Ensure model source matches expected type            |
| `LanguageNotSupported` | Language not supported by model      | Passing unsupported language to multilingual OCR or Speech-to-Text models | Use a supported language or different model          |
| `WrongDimensions`      | Input tensor dimensions don't match  | Providing input with incorrect shape for the model                        | Check model's expected input dimensions              |
| `UnexpectedNumInputs`  | Wrong number of inputs provided      | Passing more or fewer inputs than model expects                           | Match the number of inputs to model metadata         |

### File Operations Errors

These errors occur during file read/write operations.

| Error Code        | Description                 | When It Occurs                                               | How to Handle                                 |
| ----------------- | --------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `FileReadFailed`  | File read operation failed  | Invalid image URL, unsupported format, or file doesn't exist | Verify file path and format are correct       |
| `FileWriteFailed` | File write operation failed | Saving result image or output file fails                     | Check storage permissions and available space |

### Download & Resource Fetcher Errors

These errors occur during model download and resource management.

| Error Code                          | Description                      | When It Occurs                                        | How to Handle                                                             |
| ----------------------------------- | -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `DownloadInterrupted`               | Download was interrupted         | Not all files were downloaded successfully            | Retry the download                                                        |
| `ResourceFetcherDownloadFailed`     | Resource download failed         | Network error, invalid URL, or server error           | Check network connection and URL validity, retry with exponential backoff |
| `ResourceFetcherDownloadInProgress` | Download already in progress     | Calling `fetch()` for same resource while downloading | Wait for current download to complete                                     |
| `ResourceFetcherAlreadyPaused`      | Download already paused          | Calling `pauseFetching()` on already paused download  | Check download state before pausing                                       |
| `ResourceFetcherAlreadyOngoing`     | Download already ongoing         | Calling `resumeFetching()` on active download         | No action needed, download is already running                             |
| `ResourceFetcherNotActive`          | No active download found         | Calling pause/resume/cancel on non-existent download  | Verify download was started before trying to control it                   |
| `ResourceFetcherMissingUri`         | Required URI information missing | Internal state error during download operations       | Restart the download from beginning                                       |

### Speech-to-Text Streaming Errors

These errors are specific to streaming transcription operations.

| Error Code                  | Description                         | When It Occurs                                                                            | How to Handle                                                   |
| --------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `MultilingualConfiguration` | Multilingual configuration mismatch | Setting language on non-multilingual model, or not setting language on multilingual model | Check if model is multilingual and provide language accordingly |
| `MissingDataChunk`          | Audio data chunk missing            | Streaming transcription without providing audio data                                      | Ensure audio data is provided to streaming methods              |
| `StreamingNotStarted`       | Stream not started                  | Calling `stop()` or `insertData()` without calling `start()` first                        | Call `start()` before other streaming operations                |
| `StreamingInProgress`       | Stream already in progress          | Calling `start()` while another stream is active                                          | Stop current stream before starting a new one                   |

### Model Execution Errors

These errors come from the ExecuTorch runtime during model execution.

| Error Code           | Description                  | When It Occurs                                 | How to Handle                                  |
| -------------------- | ---------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `InvalidModelOutput` | Model output size unexpected | Model produces output of wrong size            | Verify model is compatible with the library    |
| `ThreadPoolError`    | Threadpool operation failed  | Internal threading issue                       | Restart the model or app                       |
| `UnknownError`       | Unexpected error occurred    | 3rd-party library error or unhandled exception | Check logs for details, report if reproducible |

### ExecuTorch Runtime Errors

These errors are mapped directly from the ExecuTorch runtime. They typically indicate lower-level execution issues.

#### System Errors

| Error Code     | Description                         |
| -------------- | ----------------------------------- |
| `Ok`           | Operation successful (not an error) |
| `Internal`     | Internal ExecuTorch error           |
| `InvalidState` | Operation called in invalid state   |
| `EndOfMethod`  | End of method reached               |

#### Logical Errors

| Error Code        | Description                          |
| ----------------- | ------------------------------------ |
| `NotSupported`    | Operation not supported by model     |
| `NotImplemented`  | Feature not implemented              |
| `InvalidArgument` | Invalid argument passed to operation |
| `InvalidType`     | Type mismatch in operation           |
| `OperatorMissing` | Required operator missing from model |

#### Resource Errors

| Error Code               | Description                |
| ------------------------ | -------------------------- |
| `NotFound`               | Resource not found         |
| `MemoryAllocationFailed` | Memory allocation failed   |
| `AccessFailed`           | Access to resource failed  |
| `InvalidProgram`         | Model program is invalid   |
| `InvalidExternalData`    | External data is invalid   |
| `OutOfResources`         | System resources exhausted |

#### Delegate Errors

| Error Code                       | Description                        |
| -------------------------------- | ---------------------------------- |
| `DelegateInvalidCompatibility`   | Delegate not compatible with model |
| `DelegateMemoryAllocationFailed` | Delegate memory allocation failed  |
| `DelegateInvalidHandle`          | Invalid delegate handle            |
