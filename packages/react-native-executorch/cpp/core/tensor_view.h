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

    /**
     * Python-like indexing. Returns a Value proxy for reading or writing the
     * element at the given multi-dimensional indices. The caller's declared type
     * selects the correct element width; a runtime guard asserts it matches the
     * tensor's dtype.
     *
     * Sample usage:
     * @code
     *   TensorView tensor(buffer, DType::int32, {1, 10});
     *   tensor[{0, 5}] = 42;               // write
     *   int32_t token = tensor[{0, 7}];    // read
     * @endcode
     */
    Value operator[](std::initializer_list<size_t> indices);

    // Metadata
    DType dtype_;
    Shape shape_;
    size_t numel_; // Number of elements (values) in a tensor
    size_t size_;  // Size of a tensor (numel * dtype.size())

    // Data (pointer - non-owning)
    uint8_t *data_ = nullptr;

private:
    size_t flatten(std::initializer_list<size_t> indices) const;
};

} // namespace rnexecutorch::core::tensor
