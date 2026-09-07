#include "dtype.h"
#include <format>

#include "core/error.h"

namespace rnexecutorch::core::types {
DType dtypeFromString(const std::string &s) {
    if (s == "uint8") {
        return DType::uint8;
    }
    if (s == "int32") {
        return DType::int32;
    }
    if (s == "int64") {
        return DType::int64;
    }
    if (s == "float32") {
        return DType::float32;
    }
    if (s == "bool") {
        return DType::boolean;
    }
    throw error::InvalidArgument(
        std::format("Unsupported dtype: '{}'. Expected 'uint8', 'int32', 'int64', 'float32' or 'bool'", s));
}

std::string dtypeToString(DType dtype) {
    switch (dtype) {
    case DType::uint8:
        return "uint8";
    case DType::int32:
        return "int32";
    case DType::int64:
        return "int64";
    case DType::float32:
        return "float32";
    case DType::boolean:
        return "bool";
    }
}

executorch::aten::ScalarType dtypeToScalarType(DType dtype) {
    switch (dtype) {
    case DType::uint8:
        return executorch::aten::ScalarType::Byte;
    case DType::int32:
        return executorch::aten::ScalarType::Int;
    case DType::int64:
        return executorch::aten::ScalarType::Long;
    case DType::float32:
        return executorch::aten::ScalarType::Float;
    case DType::boolean:
        return executorch::aten::ScalarType::Bool;
    }
}

DType dtypeFromScalarType(executorch::aten::ScalarType st) {
    switch (st) {
    case executorch::aten::ScalarType::Byte:
        return DType::uint8;
    case executorch::aten::ScalarType::Int:
        return DType::int32;
    case executorch::aten::ScalarType::Long:
        return DType::int64;
    case executorch::aten::ScalarType::Float:
        return DType::float32;
    case executorch::aten::ScalarType::Bool:
        return DType::boolean;
    default:
        throw error::InvalidArgument("Unsupported ScalarType");
    }
}

size_t elementSize(DType dtype) {
    switch (dtype) {
    // NOLINTNEXTLINE(bugprone-branch-clone): boolean and uint8 are both 1 bytes; the identical branches are intentional.
    case DType::boolean:
        return 1;
    case DType::uint8:
        return 1;
    // NOLINTNEXTLINE(bugprone-branch-clone): int32 and float32 are both 4 bytes; the identical branches are intentional.
    case DType::int32:
        return 4;
    case DType::int64:
        return 8;
    case DType::float32:
        return 4;
    }
}

} // namespace rnexecutorch::core::types
