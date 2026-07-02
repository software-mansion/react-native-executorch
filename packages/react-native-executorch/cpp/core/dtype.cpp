#include "dtype.h"
#include <stdexcept>

namespace rnexecutorch::core {

DType::DType(const std::string &s) {
    if (s == "bool") {
        v_ = DType::bool_;
    } else if (s == "uint8") {
        v_ = DType::uint8;
    } else if (s == "int32") {
        v_ = DType::int32;
    } else if (s == "int64") {
        v_ = DType::int64;
    } else if (s == "float32") {
        v_ = DType::float32;
    } else {
        throw std::invalid_argument(
            "Unsupported dtype: '" + s + "'. Expected 'bool', 'uint8', 'int32', 'int64', or 'float32'");
    }
}

DType::DType(executorch::aten::ScalarType st) {
    switch (st) {
    case executorch::aten::ScalarType::Bool:
        v_ = DType::bool_;
        break;
    case executorch::aten::ScalarType::Byte:
        v_ = DType::uint8;
        break;
    case executorch::aten::ScalarType::Int:
        v_ = DType::int32;
        break;
    case executorch::aten::ScalarType::Long:
        v_ = DType::int64;
        break;
    case executorch::aten::ScalarType::Float:
        v_ = DType::float32;
        break;
    default:
        throw std::invalid_argument("Unsupported ScalarType");
    }
}

DType::operator executorch::aten::ScalarType() const {
    switch (v_) {
    case DType::bool_:
        return executorch::aten::ScalarType::Bool;
    case DType::uint8:
        return executorch::aten::ScalarType::Byte;
    case DType::int32:
        return executorch::aten::ScalarType::Int;
    case DType::int64:
        return executorch::aten::ScalarType::Long;
    case DType::float32:
        return executorch::aten::ScalarType::Float;
    default:
        throw std::invalid_argument("Unsupported dtype");
    }
}

DType::operator std::string() const {
    switch (v_) {
    case DType::bool_:
        return "bool";
    case DType::uint8:
        return "uint8";
    case DType::int32:
        return "int32";
    case DType::int64:
        return "int64";
    case DType::float32:
        return "float32";
    default:
        throw std::invalid_argument("Unsupported dtype");
    }
}

size_t DType::size() const {
    switch (v_) {
    case DType::bool_:
    case DType::uint8:
        return 1;
    // NOLINTNEXTLINE(bugprone-branch-clone): int32 and float32 are both 4 bytes; the identical branches are intentional.
    case DType::int32:
        return 4;
    case DType::int64:
        return 8;
    case DType::float32:
        return 4;
    default:
        throw std::invalid_argument("Unsupported dtype");
    }
}

} // namespace rnexecutorch::core
