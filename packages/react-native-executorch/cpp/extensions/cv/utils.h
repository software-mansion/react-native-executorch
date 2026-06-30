#pragma once

#include "core/dtype.h"
#include <opencv2/core.hpp>
#include <stdexcept>

namespace rnexecutorch::extensions::cv {

inline int dtypeToCvDepth(rnexecutorch::core::DType dtype) {
    switch (dtype) {
    case rnexecutorch::core::DType::uint8:
        return CV_8U;
    case rnexecutorch::core::DType::int32:
        return CV_32S;
    case rnexecutorch::core::DType::float32:
        return CV_32F;
    default:
        break;
    }
    throw std::invalid_argument("unsupported dtype");
}

} // namespace rnexecutorch::extensions::cv
