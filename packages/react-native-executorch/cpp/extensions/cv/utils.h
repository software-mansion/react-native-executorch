#pragma once

#include "core/dtype.h"
#include "core/error.h"
#include <opencv2/core.hpp>

namespace rnexecutorch::extensions::cv {

/**
 * Converts an ExecuTorch DType enum value to the corresponding OpenCV matrix depth constant.
 *
 * @param dtype The input tensor data type.
 * @return The corresponding OpenCV depth constant (e.g. CV_8U, CV_32S, CV_32F).
 * @throws core::error::RnExecuTorchException with code InvalidArgument if the data type is not
 * supported by OpenCV depth representation.
 */
inline int dtypeToCvDepth(rnexecutorch::core::types::DType dtype) {
    switch (dtype) {
    case rnexecutorch::core::types::DType::uint8:
        return CV_8U;
    case rnexecutorch::core::types::DType::int32:
        return CV_32S;
    case rnexecutorch::core::types::DType::float32:
        return CV_32F;
    case rnexecutorch::core::types::DType::int64:
        break;
    }
    throw core::error::RnExecuTorchException(core::error::RnExecuTorchErrorCode::InvalidArgument, "unsupported dtype");
}

} // namespace rnexecutorch::extensions::cv
