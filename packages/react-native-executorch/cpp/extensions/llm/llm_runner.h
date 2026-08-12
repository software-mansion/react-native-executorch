#pragma once

#ifdef __clang__
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
#endif

#include <executorch/extension/llm/runner/text_llm_runner.h>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <string>

namespace rnexecutorch::extensions::llm {
/**
 * JSI HostObject wrapping an ExecuTorch Text LLM runner instance
 * (`executorch::extension::llm::TextLLMRunner`).
 *
 * Exposes methods to JavaScript for prefilling prompt context, generating token
 * stream continuations, interrupting generation, and releasing native model memory.
 */
class LLMRunnerHostObject : public facebook::jsi::HostObject,
                            public std::enable_shared_from_this<LLMRunnerHostObject> {
public:
    /**
     * Constructs an LLMRunnerHostObject by loading an ExecuTorch model binary and tokenizer.
     *
     * @param modelPath Absolute file system path to the `.pte` LLM model binary.
     * @param tokenizerPath Absolute file system path to the local tokenizer configuration file (e.g. `tokenizer.json`).
     * @throws core::error::RnExecuTorchException with code LoadFailed if loading the model or tokenizer fails.
     */
    LLMRunnerHostObject(const std::string &modelPath, const std::string &tokenizerPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    /** Owning pointer to the underlying ExecuTorch TextLLMRunner instance. */
    std::unique_ptr<executorch::extension::llm::TextLLMRunner> runner_;
    /** Mutex guarding concurrent access to prefill and generation operations. */
    std::mutex mutex_;
    /** File system path to the loaded `.pte` model binary. */
    std::string modelPath_;
    /** File system path to the loaded tokenizer configuration file. */
    std::string tokenizerPath_;
};

void install_createLLMRunner(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::llm
