#pragma once

#include <cstddef>
#include <cstdint>
#include <memory>
#include <shared_mutex>
#include <vector>

#include "dtype.h"

#include <jsi/jsi.h>

#include <executorch/extension/tensor/tensor_ptr.h>

namespace rnexecutorch::core::tensor {
namespace jsi = facebook::jsi;
namespace types = rnexecutorch::core::types;

/**
 * JSI HostObject wrapping an ExecuTorch TensorPtr instance.
 *
 * Exposes methods to JavaScript for copying data, accessing properties (shape,
 * dtype, numel), writing data from array buffers, reading data to array
 * buffers, and disposing of underlying memory.
 */
class TensorHostObject final : public jsi::HostObject,
                               public std::enable_shared_from_this<TensorHostObject> {
public:
    /** Data type of the tensor elements. */
    const types::DType dtype_;
    /** Dimensions (shape) of the tensor. */
    const std::vector<std::int32_t> shape_;
    /** Total number of elements contained in the tensor. */
    const size_t numel_;
    /** Total memory size of the tensor data buffer in bytes. */
    const size_t size_;

    /** Owning byte buffer holding the raw tensor data. */
    std::unique_ptr<std::uint8_t[]> data_; // NOLINT(cppcoreguidelines-avoid-c-arrays,modernize-avoid-c-arrays): owning runtime-sized byte buffer
    /** ExecuTorch TensorPtr instance wrapping the data buffer. */
    executorch::extension::TensorPtr tensor_;

    /** Shared mutex guarding concurrent read/write access to the tensor data. */
    std::shared_mutex mutex_;

    /**
     * Constructs a TensorHostObject with the specified shape and data type.
     *
     * Allocates and zero-initializes the underlying memory buffer for the tensor data.
     *
     * @param shape The dimensions of the tensor.
     * @param dtype The data type of the tensor elements.
     */
    TensorHostObject(const std::vector<std::int32_t> &shape, types::DType dtype);

    jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;
};

void install_createTensor(jsi::Runtime &rt, jsi::Object &module);
} // namespace rnexecutorch::core::tensor
