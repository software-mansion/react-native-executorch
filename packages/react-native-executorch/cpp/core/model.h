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
 * Optional companion method name inside a `.pte` ExecuTorch module that exports
 * a JSON model spec (containing dynamic dimension domains or runtime constraints).
 */
inline constexpr auto kGetModelSchemaMethod = "get_model_schema";

/**
 * JSI HostObject wrapping an ExecuTorch Model instance
 * (`executorch::extension::Module`).
 *
 * Exposes methods to JavaScript for inspecting model method signatures,
 * retrieving method names, executing inference runs, and disposing of native
 * resources.
 */
class ModelHostObject final : public jsi::HostObject,
                              public std::enable_shared_from_this<ModelHostObject> {
public:
    /**
     * Loads the ExecuTorch model from the specified file path, initializes its
     * method metadata, parses schemas, and populates backend delegates.
     *
     * @param modelPath Absolute file system path to the `.pte` model binary.
     * @param eagerLoadMethods Whether to eagerly load and compile all model methods.
     */
    explicit ModelHostObject(const std::string &modelPath, bool eagerLoadMethods);

    jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
    /// File system path to the loaded ExecuTorch `.pte` model binary.
    std::string modelPath_;

    /**
     * Parsed model schema mapping method names to their input/output parameter
     * specs and runtime constraints.
     */
    schema::ModelSpec spec_;

    /**
     * Map of method names to the list of backend delegate identifiers used by
     * each method.
     */
    std::unordered_map<std::string, std::vector<std::string>> backends_;

    /**
     * Mutex serializing access to `etModule_` to prevent concurrent inference
     * execution on the same model.
     */
    std::mutex mutex_;

    /// Unique pointer to the underlying ExecuTorch module instance.
    std::unique_ptr<executorch::extension::Module> etModule_;
};

void install_loadModel(jsi::Runtime &rt, jsi::Object &module);

} // namespace rnexecutorch::core::model
