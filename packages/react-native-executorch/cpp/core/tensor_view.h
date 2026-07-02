#pragma once

#include <cstdint>

#include "dtype.h"
#include "types.h"

namespace rnexecutorch::core::tensor {

class TensorView {
public:
    TensorView(uint8_t *data, DType dtype, Shape shape);
    virtual ~TensorView() = default;

    TensorView(const TensorView &) = delete;
    TensorView &operator=(const TensorView &) = delete;
    TensorView(TensorView &&) = default;
    TensorView &operator=(TensorView &&) = default;

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
