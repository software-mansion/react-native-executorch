#pragma once

#include <cstdint>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <string>

namespace rnexecutorch::core::types {

/**
 * Supported tensor data types across the native runtime and JavaScript interface.
 */
enum class DType {
    uint8,
    int32,
    int64,
    float32
};

/**
 * Parses a string representation into a DType enum value.
 *
 * @param s The string name of the data type (e.g. "uint8", "int32", "int64", "float32").
 * @return The corresponding DType enum value.
 * @throws error::RnExecuTorchException with code InvalidArgument if the string
 * does not match any known DType.
 */
DType dtypeFromString(const std::string &s);

/**
 * Converts a DType enum value to its string representation.
 *
 * @param dtype The DType enum value to convert.
 * @return The string representation of the data type.
 */
std::string dtypeToString(DType dtype);

/**
 * Converts a DType enum value to the corresponding ExecuTorch ScalarType.
 *
 * @param dtype The DType enum value to convert.
 * @return The corresponding ExecuTorch ScalarType.
 */
executorch::aten::ScalarType dtypeToScalarType(DType dtype);

/**
 * Converts an ExecuTorch ScalarType to the corresponding DType enum value.
 *
 * @param st The ExecuTorch ScalarType to convert.
 * @return The corresponding DType enum value.
 * @throws error::RnExecuTorchException with code InvalidArgument if the
 * ScalarType is not supported.
 */
DType dtypeFromScalarType(executorch::aten::ScalarType st);

/**
 * Returns the byte size of a single element for the specified DType.
 *
 * @param dtype The DType enum value.
 * @return The size in bytes of a single element of that data type.
 */
size_t elementSize(DType dtype);

} // namespace rnexecutorch::core::types
