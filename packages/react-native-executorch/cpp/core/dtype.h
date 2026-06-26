#pragma once

#include <cstdint>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <string>

namespace rnexecutorch::core::types {
enum class DType {
    uint8,
    int32,
    float32
};

DType parseDType(const std::string &s);
std::string toString(DType dtype);

executorch::aten::ScalarType toScalarType(DType dtype);
DType fromScalarType(executorch::aten::ScalarType st);

size_t elementSize(DType dtype);

} // namespace rnexecutorch::core::types
