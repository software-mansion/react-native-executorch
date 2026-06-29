#pragma once

#include <cstdint>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <string>

namespace rnexecutorch::core {

class DType {
public:
    enum Value : uint8_t { bool_,
                           uint8,
                           int32,
                           int64,
                           float32 };

    DType(Value v) : v_(v) {}               // Direct initialization
    DType(executorch::aten::ScalarType st); // Initialization from corresponding ET type
    DType(const std::string &s);            // Initialization from name (for JSI applications)

    // Returns the size (in bytes) of the type.
    size_t size() const;

    // Hidden operator-like conversions provide a good layer of abstraction.
    operator Value() const { return v_; }
    explicit operator executorch::aten::ScalarType() const;
    operator std::string() const;

private:
    Value v_;
};

} // namespace rnexecutorch::core
