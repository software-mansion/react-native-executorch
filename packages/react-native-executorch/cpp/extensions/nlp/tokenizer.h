#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <string_view>
#include <vector>

#include <jsi/jsi.h>

#include <pytorch/tokenizers/hf_tokenizer.h>

namespace rnexecutorch::extensions::nlp::tokenizer {

/**
 * JSI HostObject wrapping a HuggingFace Tokenizer instance (`tokenizers::HFTokenizer`).
 *
 * Exposes methods to JavaScript for encoding text to token IDs, decoding token IDs
 * to text, and managing tokenizer resources.
 */
class TokenizerHostObject : public facebook::jsi::HostObject,
                            public std::enable_shared_from_this<TokenizerHostObject> {
public:
    /**
     * Constructs a TokenizerHostObject by loading a HuggingFace tokenizer configuration file.
     *
     * @param tokenizerPath File system path to the tokenizer configuration file.
     * @throws std::runtime_error If loading the tokenizer fails.
     */
    explicit TokenizerHostObject(std::string tokenizerPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    /**
     * Tries to acquire a unique lock on the tokenizer's mutex.
     * Throws a facebook::jsi::JSError with contextual error info if the lock cannot be acquired.
     *
     * @param rt The JSI runtime instance.
     * @param context Context description used to generate helpful error messages.
     * @return A unique lock protecting the tokenizer.
     */
    [[nodiscard]] std::unique_lock<std::mutex> tryLockUnique(facebook::jsi::Runtime &rt,
                                                             std::string_view context);

    /** File path to the HuggingFace tokenizer JSON configuration file. */
    std::string tokenizerPath_;
    /** Owning pointer to the underlying HuggingFace tokenizer instance. */
    std::unique_ptr<tokenizers::HFTokenizer> tokenizer_;
    /** Mutex guarding concurrent access to the tokenizer. */
    std::mutex mutex_;
};

void install_loadTokenizer(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::nlp::tokenizer
