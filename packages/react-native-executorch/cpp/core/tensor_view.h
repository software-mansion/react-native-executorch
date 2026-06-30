#pragma once

#include <cstdint>

#include "dtype.h"
#include "types.h"
#include "value.h"

namespace rnexecutorch::core::tensor {

class TensorView {
public:
    TensorView(uint8_t *data, DType dtype, Shape shape);

    virtual ~TensorView() {}

    // This class leaves a space for some additional logic if needed.

    // Metadata
    DType dtype_;
    Shape shape_;
    size_t numel_; // Number of elements (values) in a tensor
    size_t size_;  // Size of a tensor (numel * dtype.size())

    // Data (pointer - non-owning)
    uint8_t *data_ = nullptr;
};

} // namespace rnexecutorch::core::tensor
