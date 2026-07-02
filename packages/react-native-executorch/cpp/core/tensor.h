#pragma once

#include <cstdint>
#include <memory>
#include <mutex>
#include <shared_mutex>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>

#include "dtype.h"

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
class TensorHostObject : public jsi::HostObject,
                         public std::enable_shared_from_this<TensorHostObject> {
public:
    types::DType dtype_;
    std::vector<std::int32_t> shape_;
    size_t numel_;
    size_t size_;

    // NOLINTNEXTLINE(cppcoreguidelines-avoid-c-arrays,modernize-avoid-c-arrays): owning runtime-sized byte buffer
    std::unique_ptr<std::uint8_t[]> data_;
    executorch::extension::TensorPtr tensor_;

    std::shared_mutex mutex_;

    TensorHostObject(const std::vector<std::int32_t> &shape, types::DType dtype);

    jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;
};

void install_createTensor(jsi::Runtime &rt, jsi::Object &module);
} // namespace rnexecutorch::core::tensor
