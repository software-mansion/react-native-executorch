#include "tensor_view.h"
#include <cassert>
#include <numeric>
#include <stdexcept>

namespace rnexecutorch::core::tensor {

TensorView::TensorView(uint8_t *data, DType dtype, Shape shape)
    : dtype_(dtype), shape_(std::move(shape)), data_(data) {
    if (shape_.empty()) {
        throw std::invalid_argument("TensorView: shape must not be empty");
    }

    numel_ = std::accumulate(shape_.begin(), shape_.end(), size_t(1), std::multiplies<size_t>());
    size_ = numel_ * dtype_.size();
}

Value TensorView::operator[](std::initializer_list<size_t> indices) {
    size_t flat = flatten(indices);
    return Value(data_ + flat * dtype_.size(), dtype_);
}

size_t TensorView::flatten(std::initializer_list<size_t> indices) const {
    assert(indices.size() == shape_.size());

    size_t flat = 0;
    auto shape_it = shape_.begin();
    for (auto idx : indices) {
        assert(idx < static_cast<size_t>(*shape_it));
        flat = flat * static_cast<size_t>(*shape_it) + idx;
        ++shape_it;
    }

    return flat;
}

} // namespace rnexecutorch::core::tensor
