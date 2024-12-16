package com.swmansion.rnexecutorch.utils

enum class ETError(val code: Int) {
    UndefinedError(0x65),
    ModuleNotLoaded(0x66),
    FileWriteFailed(0x67),
    InvalidModelPath(0xff),

  // System errors
    Ok(0x00),
    Internal(0x01),
    InvalidState(0x02),
    EndOfMethod(0x03),

    // Logical errors
    NotSupported(0x10),
    NotImplemented(0x11),
    InvalidArgument(0x12),
    InvalidType(0x13),
    OperatorMissing(0x14),

    // Resource errors
    NotFound(0x20),
    MemoryAllocationFailed(0x21),
    AccessFailed(0x22),
    InvalidProgram(0x23),

    // Delegate errors
    DelegateInvalidCompatibility(0x30),
    DelegateMemoryAllocationFailed(0x31),
    DelegateInvalidHandle(0x32);
}
