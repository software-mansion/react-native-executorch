#pragma once

#if defined(__clang__)
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
#endif

#include <executorch/extension/llm/runner/text_llm_runner.h>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <string>

namespace rnexecutorch::extensions::llm {
class LLMRunnerHostObject : public facebook::jsi::HostObject, public std::enable_shared_from_this<LLMRunnerHostObject> {
public:
    LLMRunnerHostObject(const std::string &modelPath, const std::string &tokenizerPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;

private:
    std::unique_ptr<executorch::extension::llm::TextLLMRunner> runner_;
    std::mutex mutex_;
    std::string modelPath_;
    std::string tokenizerPath_;
};

void install_createLLMRunner(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::llm
