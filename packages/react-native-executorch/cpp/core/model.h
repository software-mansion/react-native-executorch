#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include "schema.h"
#include "tensor_helpers.h"

#include <jsi/jsi.h>

#include <executorch/extension/module/module.h>

namespace rnexecutorch::core::model {
namespace jsi = facebook::jsi;
/**
 * JSI HostObject wrapping an ExecuTorch Model instance
 * (`executorch::extension::Module`).
 *
 * Exposes methods to JavaScript for inspecting model method signatures,
 * retrieving method names, executing inference runs, and disposing of native
 * resources.
 */
class ModelHostObject : public jsi::HostObject,
                        public std::enable_shared_from_this<ModelHostObject> {
public:
    explicit ModelHostObject(const std::string &modelPath);

    jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
    std::string modelPath_;
    schema::ModelSpec spec_;
    std::unordered_map<std::string, std::vector<std::string>> backends_;

    std::unique_ptr<executorch::extension::Module> etModule_;
    std::mutex mutex_;
};

void install_loadModel(jsi::Runtime &rt, jsi::Object &module);
} // namespace rnexecutorch::core::model
