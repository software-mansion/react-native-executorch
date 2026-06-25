#pragma once

#include <cstdint>

#include "dtype.h"

namespace rnexecutorch::core::tensor {

// An abstract wrapper representing a single tensor element.
// Designed to work as a flexible runtime multi-type, limited only by the available dtypes.
class Value {
public:
    Value(uint8_t *ptr, DType dtype) : ptr_(ptr), dtype_(dtype) {}

    template <typename T>
    Value &operator=(const T &val) {
        assert(sizeof(T) == dtype_.size()); // runtime guard
        *reinterpret_cast<T *>(ptr_) = val;
        return *this;
    }

    template <typename T>
    operator T() const {
        assert(sizeof(T) == dtype_.size()); // runtime guard
        return *reinterpret_cast<const T *>(ptr_);
    }

private:
    uint8_t *ptr_;
    DType dtype_;
};

} // namespace rnexecutorch::core::tensor
