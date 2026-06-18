#pragma once

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
 */
class ModelHostObject : public facebook::jsi::HostObject, public std::enable_shared_from_this<ModelHostObject> {
public:
    std::string modelPath_;
    std::unique_ptr<executorch::extension::Module> etModule_;
    std::mutex mutex_;

    ModelHostObject(const std::string &modelPath);

    facebook::jsi::Value get(facebook::jsi::Runtime &rt, const facebook::jsi::PropNameID &name) override;
    std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &rt) override;
};

void install_loadModel(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core::model
