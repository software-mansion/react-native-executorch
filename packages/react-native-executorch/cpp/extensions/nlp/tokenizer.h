#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <string_view>
#include <vector>

#include <jsi/jsi.h>

#include <pytorch/tokenizers/hf_tokenizer.h>

namespace rnexecutorch::extensions::nlp::tokenizer {
class TokenizerHostObject : public facebook::jsi::HostObject,
                            public std::enable_shared_from_this<TokenizerHostObject> {
public:
    // Loads the tokenizer from `tokenizerPath`; throws std::runtime_error on failure.
    explicit TokenizerHostObject(std::string tokenizerPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    [[nodiscard]] std::unique_lock<std::mutex> tryLockUnique(facebook::jsi::Runtime &rt,
                                                             std::string_view context);

    std::string tokenizerPath_;
    std::unique_ptr<tokenizers::HFTokenizer> tokenizer_;
    std::mutex mutex_;
};

void install_loadTokenizer(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::nlp::tokenizer
