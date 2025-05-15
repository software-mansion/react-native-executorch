export enum ETError {
  // React-native-ExecuTorch errors
  UndefinedError = 0x65,
  ModuleNotLoaded = 0x66,
  FileWriteFailed = 0x67,
  ModelGenerating = 0x68,
  LanguageNotSupported = 0x69,
  InvalidModelSource = 0xff,

  // ExecuTorch mapped errors
  // Based on: https://github.com/pytorch/executorch/blob/main/runtime/core/error.h
  // System errors
  Ok = 0x00,
  Internal = 0x01,
  InvalidState = 0x02,
  EndOfMethod = 0x03,

  // Logical errors
  NotSupported = 0x10,
  NotImplemented = 0x11,
  InvalidArgument = 0x12,
  InvalidType = 0x13,
  OperatorMissing = 0x14,

  // Resource errors
  NotFound = 0x20,
  MemoryAllocationFailed = 0x21,
  AccessFailed = 0x22,
  InvalidProgram = 0x23,
  InvalidExternalData = 0x24,
  OutOfResources = 0x25,

  // Delegate errors
  DelegateInvalidCompatibility = 0x30,
  DelegateMemoryAllocationFailed = 0x31,
  DelegateInvalidHandle = 0x32,
}

export const getError = (e: unknown | ETError): string => {
  if (typeof e === 'number') {
    if (e in ETError) return ETError[e] as string;
    return ETError[ETError.UndefinedError] as string;
  }

  // try to extract number from message (can contain false positives)
  const error = e as Error;
  const errorCode = parseInt(error.message, 10);
  const ETErrorMessage = (
    errorCode in ETError ? ETError[errorCode] : ETError[ETError.UndefinedError]
  ) as string;

  return ETErrorMessage + error.message;
};
