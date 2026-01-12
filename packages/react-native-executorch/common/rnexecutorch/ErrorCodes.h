#pragma once

// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - Run 'yarn codegen:errors' to regenerate

#include <cstdint>

namespace rnexecutorch {

enum class RnExecutorchInternalError : int32_t {
  UndefinedError = 101,
  ModuleNotLoaded = 102,
  FileWriteFailed = 103,
  ModelGenerating = 104,
  LanguageNotSupported = 105,
  InvalidConfig = 112,
  InvalidModelSource = 255,
  UnexpectedNumInputs = 97,
  ThreadPoolError = 113,
  FileReadFailed = 114,
  InvalidModelOutput = 115,
  WrongDimensions = 116,
  MultilingualConfiguration = 160,
  MissingDataChunk = 161,
  StreamingNotStarted = 162,
  StreamingInProgress = 163,
  Ok = 0,
  Internal = 1,
  InvalidState = 2,
  EndOfMethod = 3,
  NotSupported = 16,
  NotImplemented = 17,
  InvalidArgument = 18,
  InvalidType = 19,
  OperatorMissing = 20,
  NotFound = 32,
  MemoryAllocationFailed = 33,
  AccessFailed = 34,
  InvalidProgram = 35,
  InvalidExternalData = 36,
  OutOfResources = 37,
  DelegateInvalidCompatibility = 48,
  DelegateMemoryAllocationFailed = 49,
  DelegateInvalidHandle = 50,
};

} // namespace rnexecutorch
