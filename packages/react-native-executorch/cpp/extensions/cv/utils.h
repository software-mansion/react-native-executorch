#pragma once

#include "core/dtype.h"
#include <jsi/jsi.h>
#include <opencv2/core.hpp>
#include <stdexcept>
#include <string>

namespace rnexecutorch::extensions::cv {

inline int dtypeToCvDepth(rnexecutorch::core::types::DType dtype) {
    switch (dtype) {
    case rnexecutorch::core::types::DType::uint8:
        return CV_8U;
    case rnexecutorch::core::types::DType::int32:
        return CV_32S;
    case rnexecutorch::core::types::DType::float32:
        return CV_32F;
    }
    throw std::invalid_argument("unsupported dtype");
}

} // namespace rnexecutorch::extensions::cv
