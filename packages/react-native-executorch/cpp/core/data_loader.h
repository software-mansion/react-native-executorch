#pragma once

#include <memory>
#include <string>
#include <vector>

#include <executorch/runtime/core/data_loader.h>
#include <jsi/jsi.h>

namespace rnexecutorch::core::data_loader {

/**
 * Owns JS callbacks only for the duration of synchronous model initialization.
 * Adapters handed to Module may outlive this scope, but retain no JS handles
 * afterward. Their already-loaded buffers have independent native ownership.
 * Nonempty reads after initialization return InvalidState; there is no lazy
 * callback or whole-source cache.
 */
class LoadSession final {
public:
    explicit LoadSession(facebook::jsi::Runtime &rt);
    ~LoadSession();

    LoadSession(const LoadSession &) = delete;
    LoadSession &operator=(const LoadSession &) = delete;
    LoadSession(LoadSession &&) = delete;
    LoadSession &operator=(LoadSession &&) = delete;

    /**
     * Creates an adapter for a JS { size, load } object. Calls size once.
     * @throws error::RnExecuTorchException with code InvalidArgument for invalid
     * callbacks or sizes. Exceptions from the caller's size callback propagate.
     */
    std::unique_ptr<executorch::runtime::DataLoader> create(const std::string &ctx,
                                                            const facebook::jsi::Value &value);

    /// Rethrows the original callback/validation exception instead of ET's
    /// transport error. Must run before this scope releases its JS handles.
    void rethrowIfFailed() const;

private:
    struct State;
    class Adapter;

    facebook::jsi::Runtime &rt_;
    std::vector<std::shared_ptr<State>> states_;
};

} // namespace rnexecutorch::core::data_loader
