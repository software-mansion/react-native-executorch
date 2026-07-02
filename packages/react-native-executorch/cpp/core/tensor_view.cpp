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

    numel_ = std::accumulate(shape_.begin(), shape_.end(),
                             static_cast<size_t>(1), std::multiplies<>());
    size_ = numel_ * dtype_.size();
}

} // namespace rnexecutorch::core::tensor
