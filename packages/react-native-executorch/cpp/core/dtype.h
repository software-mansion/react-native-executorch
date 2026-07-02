#pragma once

#include <cstdint>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <string>

namespace rnexecutorch::core {

class DType {
public:
    // NOLINTNEXTLINE(cppcoreguidelines-use-enum-class) - this enum is already inside a class, co it's effectively enum class
    enum Value : uint8_t { bool_,
                           uint8,
                           int32,
                           int64,
                           float32 };

    // NOLINTNEXTLINE(google-explicit-constructor) — intentional implicit conversion from Value
    DType(Value v) : v_(v) {}
    // NOLINTNEXTLINE(google-explicit-constructor) — intentional implicit conversion from ScalarType
    DType(executorch::aten::ScalarType st);
    // NOLINTNEXTLINE(google-explicit-constructor) — intentional implicit conversion from string
    DType(const std::string &s);

    // Returns the size (in bytes) of the type.
    [[nodiscard]] size_t size() const;

    // Hidden operator-like conversions provide a good layer of abstraction.
    // NOLINTNEXTLINE(google-explicit-constructor) — intentional implicit conversion to Value
    operator Value() const { return v_; }
    explicit operator executorch::aten::ScalarType() const;
    // NOLINTNEXTLINE(google-explicit-constructor) — intentional implicit conversion to string
    operator std::string() const;

private:
    Value v_;
};

} // namespace rnexecutorch::core
