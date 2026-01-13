// Single source of truth for error codes
// Run `yarn codegen:errors` to generate C++ and TypeScript enums

export const errorDefinitions = {
  // React-native-ExecuTorch errors
  UndefinedError: 0x65,
  ModuleNotLoaded: 0x66,
  FileWriteFailed: 0x67,
  ModelGenerating: 0x68,
  LanguageNotSupported: 0x69,
  InvalidConfig: 0x70,
  InvalidModelSource: 0xff,
  UnexpectedNumInputs: 0x61,
  ThreadPoolError: 0x71,
  FileReadFailed: 0x72,
  InvalidModelOutput: 0x73,
  WrongDimensions: 0x74,
  InvalidUserInput: 0x75,
  DownloadInterrupted: 0x76,

  // SpeechToText errors
  MultilingualConfiguration: 0xa0,
  MissingDataChunk: 0xa1,
  StreamingNotStarted: 0xa2,
  StreamingInProgress: 0xa3,

  // ExecuTorch mapped errors
  // Based on: https://github.com/pytorch/executorch/blob/main/runtime/core/error.h
  // System errors
  Ok: 0x00,
  Internal: 0x01,
  InvalidState: 0x02,
  EndOfMethod: 0x03,

  // Logical errors
  NotSupported: 0x10,
  NotImplemented: 0x11,
  InvalidArgument: 0x12,
  InvalidType: 0x13,
  OperatorMissing: 0x14,

  // Resource errors
  NotFound: 0x20,
  MemoryAllocationFailed: 0x21,
  AccessFailed: 0x22,
  InvalidProgram: 0x23,
  InvalidExternalData: 0x24,
  OutOfResources: 0x25,

  // Delegate errors
  DelegateInvalidCompatibility: 0x30,
  DelegateMemoryAllocationFailed: 0x31,
  DelegateInvalidHandle: 0x32,
} as const;

export type ErrorName = keyof typeof errorDefinitions;
