#pragma once

#include <memory>
#include <mutex>
#include <shared_mutex>

#include <jsi/jsi.h>

#include <executorch/extension/tensor/tensor.h>

#include "tensor_view.h"
#include "types.h"

namespace rnexecutorch::core::tensor {

/**
 * A JSI HostObject that wraps an owning or non-owning tensor view.
 */
class TensorHostObject : public facebook::jsi::HostObject,
                         public TensorView,
                         public std::enable_shared_from_this<TensorHostObject> {
public:
    // Owning tensor allocation.
    TensorHostObject(Shape shape, DType dtype);

    // Non-owning tensor (view) wrapping external data.
    TensorHostObject(const TensorView &view);                  // Direct
    TensorHostObject(uint8_t *data, Shape shape, DType dtype); // Indirect

    // JSI bridge methods.
    facebook::jsi::Value get(facebook::jsi::Runtime &rt,
                             const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(
        facebook::jsi::Runtime &rt) override;

    // Owned data storage — null for views.
    std::unique_ptr<uint8_t[]> storage_;

    // ExecuTorch entry point.
    executorch::extension::TensorPtr et_tensor_;

    std::shared_mutex mutex_;
};

void install_createTensor(facebook::jsi::Runtime &rt,
                          facebook::jsi::Object &module);

} // namespace rnexecutorch::core::tensor
