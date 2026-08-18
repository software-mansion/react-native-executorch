#pragma once

// Upstream ExecuTorch annotates experimental LLM APIs (TextLLMRunner, Stats,
// etc.) with `ET_EXPERIMENTAL`, which expands to `[[deprecated("This API is
// experimental...")]]`. We suppress -Wdeprecated-declarations so Clang does not
// fail builds on ExecuTorch's experimental API tags.
#ifdef __clang__
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
#endif

#include <memory>
#include <mutex>
#include <string>
#include <string_view>
#include <vector>

#include <jsi/jsi.h>

#include <executorch/extension/llm/runner/irunner.h>

namespace rnexecutorch::extensions::llm {
/**
 * [EXPERIMENTAL] JSI HostObject wrapping an ExecuTorch LLM runner instance
 * (`executorch::extension::llm::IRunner`).
 *
 * @note This implementation is EXPERIMENTAL. It builds upon upstream ExecuTorch
 * experimental LLM runtime APIs (`ET_EXPERIMENTAL`) and utilizes internal
 * reflection techniques to manage KV cache write heads and context metrics.
 * The underlying interfaces and behavior might change across ExecuTorch releases.
 *
 * Exposes methods to JavaScript for prefilling prompt context, generating token
 * stream continuations, interrupting generation, resetting the KV cache context,
 * and releasing native model memory.
 */
class LLMRunnerHostObject : public facebook::jsi::HostObject,
                            public std::enable_shared_from_this<LLMRunnerHostObject> {
public:
    /**
     * Constructs an LLMRunnerHostObject by loading an ExecuTorch model binary
     * and tokenizer.
     *
     * @param modelPath Absolute file system path to the `.pte` LLM model
     * binary.
     * @param tokenizerPath Absolute file system path to the local tokenizer
     * configuration file (e.g. `tokenizer.json`).
     * @param modalities Vector of supported input modality names (e.g.
     * `{"image"}`).
     * @throws core::error::RnExecuTorchException with code LoadFailed if
     * loading the model or tokenizer fails.
     */
    LLMRunnerHostObject(const std::string &modelPath,
                        const std::string &tokenizerPath,
                        const std::vector<std::string> &modalities);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    /**
     * Tries to acquire a unique lock on the runner's mutex.
     *
     * @param ctx Context description used to generate helpful error messages.
     * @return A unique lock protecting the runner.
     * @throws core::error::RnExecuTorchException with code ResourceBusy if the
     * lock is currently held by another thread, or ResourceDisposed if the
     * runner has already been disposed.
     */
    [[nodiscard]] std::unique_lock<std::mutex> tryLockUnique(std::string_view ctx);

    /** Owning pointer to the underlying ExecuTorch IRunner instance. */
    std::unique_ptr<executorch::extension::llm::IRunner> runner_;
    /** Mutex guarding concurrent access to prefill and generation operations. */
    std::mutex mutex_;
    /** File system path to the loaded `.pte` model binary. */
    std::string modelPath_;
    /** File system path to the loaded tokenizer configuration file. */
    std::string tokenizerPath_;
    /** List of supported non-text input modalities. */
    std::vector<std::string> modalities_;
};

void install_createLLMRunner(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::llm
