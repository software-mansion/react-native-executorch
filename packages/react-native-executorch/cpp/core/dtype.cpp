#include "dtype.h"
#include <stdexcept>

namespace rnexecutorch::core::types {
DType parseDType(const std::string &s) {
    if (s == "uint8") {
        return DType::uint8;
    }
    if (s == "int32") {
        return DType::int32;
    }
    if (s == "float32") {
        return DType::float32;
    }
    throw std::invalid_argument("Unsupported dtype: '" + s + "'. Expected 'uint8', 'int32', or 'float32'");
}

std::string toString(DType dtype) {
    switch (dtype) {
    case DType::uint8:
        return "uint8";
    case DType::int32:
        return "int32";
    case DType::float32:
        return "float32";
    }
}

executorch::aten::ScalarType toScalarType(DType dtype) {
    switch (dtype) {
    case DType::uint8:
        return executorch::aten::ScalarType::Byte;
    case DType::int32:
        return executorch::aten::ScalarType::Int;
    case DType::float32:
        return executorch::aten::ScalarType::Float;
    }
}

DType fromScalarType(executorch::aten::ScalarType st) {
    switch (st) {
    case executorch::aten::ScalarType::Byte:
        return DType::uint8;
    case executorch::aten::ScalarType::Int:
        return DType::int32;
    case executorch::aten::ScalarType::Float:
        return DType::float32;
    default:
        throw std::invalid_argument("Unsupported ScalarType");
    }
}

size_t elementSize(DType dtype) {
    switch (dtype) {
    case DType::uint8:
        return 1;
    // NOLINTNEXTLINE(bugprone-branch-clone): int32 and float32 are both 4 bytes; the identical branches are intentional.
    case DType::int32:
        return 4;
    case DType::float32:
        return 4;
    }
}

} // namespace rnexecutorch::core::types
