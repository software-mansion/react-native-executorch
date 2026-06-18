#pragma once

#include <cstdint>
#include <memory>
#include <mutex>
#include <shared_mutex>
#include <vector>

#include <jsi/jsi.h>

#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/exec_aten/exec_aten.h>

#include "dtype.h"

namespace rnexecutorch::core::tensor {
/**
 * JSI HostObject wrapping an ExecuTorch TensorPtr instance.
 *
 * Exposes methods to JavaScript for copying data, accessing properties (shape,
 * dtype, numel), writing data from array buffers, reading data to array
 * buffers, and disposing of underlying memory.
 */
class TensorHostObject : public facebook::jsi::HostObject, public std::enable_shared_from_this<TensorHostObject> {
public:
    rnexecutorch::core::types::DType dtype_;
    std::vector<std::int32_t> shape_;
    size_t numel_;

    size_t size_;
    std::unique_ptr<std::uint8_t[]> data_;
    executorch::extension::TensorPtr tensor_;

    std::shared_mutex mutex_;

    TensorHostObject(const std::vector<std::int32_t> &shape, rnexecutorch::core::types::DType dtype);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;
};

/**
 * Installs the `createTensor` function into the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_createTensor(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core::tensor
