#pragma once

#include <array>
#include <cstdint>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include <jsi/jsi.h>

#include <executorch/extension/module/module.h>

namespace rnexecutorch::core::model {
/**
 * JSI HostObject wrapping an ExecuTorch Model instance
 * (`executorch::extension::Module`).
 *
 * Exposes methods to JavaScript for inspecting model method signatures,
 * retrieving method names, executing inference runs, and disposing of native
 * resources.
 *
 * ## `execute` input/output validation
 *
 * Every tensor passed to `execute` is checked for a matching dtype and rank.
 * Output tensors are pre-allocated and written into, so each of their
 * dimensions must equal the method signature exactly; the same exact match is
 * required for the inputs of a statically shaped model.
 *
 * A model exported with dynamically shaped `forward` inputs (e.g. a variable
 * sequence length) may declare their allowed ranges through an optional
 * `get_dynamic_dims` method. It takes no arguments and returns an int64
 * `[D, 3]` tensor of `[min, max, step]` rows — one per dimension of `forward`'s
 * tensor inputs, flattened in input order. When present, each input dimension
 * is accepted when `min <= size <= max` and (for `step > 1`)
 * `(size - min) % step == 0`, instead of requiring an exact match; a static
 * dimension is encoded as `{n, n, 1}` and so still matches exactly. This lets
 * variable-shaped inputs through while rejecting out-of-range shapes before
 * they reach the runtime. Models without the method keep exact validation.
 *
 * The bounds are constant for a loaded model, so they are read from
 * `get_dynamic_dims` once (on the first `forward` execution) and cached. A model
 * that declares the method but returns a malformed tensor, or whose rows do not
 * cover exactly the dimensions of `forward`'s tensor inputs, is rejected with an
 * explicit error rather than silently falling back to exact validation.
 */
class ModelHostObject : public facebook::jsi::HostObject, public std::enable_shared_from_this<ModelHostObject> {
public:
    std::string modelPath_;
    std::unique_ptr<executorch::extension::Module> etModule_;
    std::mutex mutex_;

    // Cached, lazily-parsed `[min, max, step]` bounds from `get_dynamic_dims`,
    // one row per dimension of `forward`'s tensor inputs (flattened in input
    // order). Empty when the model does not declare the method. See the class
    // docs for the contract. Access is serialized by `mutex_` (held during
    // `execute`).
    bool dynamicBoundsComputed_ = false;
    std::vector<std::array<int64_t, 3>> dynamicInputBounds_;

    explicit ModelHostObject(const std::string &modelPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    // Returns the cached bounds, parsing `get_dynamic_dims` on first use.
    // Throws if the method is present but returns a malformed tensor.
    const std::vector<std::array<int64_t, 3>> &getDynamicInputBounds(facebook::jsi::Runtime &rt);
};

void install_loadModel(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core::model
