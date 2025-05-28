#include "ExecutorchModule.h"

#include <fmt/core.h>
#include <rnexecutorch/Log.h>
#include <unordered_set>

namespace rnexecutorch {

using ::executorch::extension::Module;
using ::executorch::runtime::Error;

ExecutorchModule::ExecutorchModule(const std::string &modelSource,
                                   facebook::jsi::Runtime *runtime)
    : module(std::make_unique<Module>(
          modelSource, Module::LoadMode::MmapUseMlockIgnoreErrors)),
      runtime(runtime) {
  Error loadError = module->load();
  if (loadError != Error::Ok) {
    throw std::runtime_error("Couldn't load the model, error: " +
                             std::to_string(static_cast<uint32_t>(loadError)));
  }
}

std::unordered_set<std::string> ExecutorchModule::methodNames() {
  auto result = module->method_names();
  if (!result.ok()) {
    throw std::runtime_error("Failed to get method_names!");
  }
  return result.get();
}

bool ExecutorchModule::isLoaded() { return module->is_loaded(); }

std::vector<int32_t> ExecutorchModule::getInputShape(std::string method_name,
                                                     int index) {
  auto method_meta = module->method_meta(method_name);
  if (!method_meta.ok()) {
    throw std::runtime_error("Failed to load method");
  }

  auto input_meta = method_meta->input_tensor_meta(index);
  if (!input_meta.ok()) {
    throw std::runtime_error("Failed to load input for given method");
  }
  auto shape = input_meta->sizes();
  return std::vector<int32_t>(shape.begin(), shape.end());
}
} // namespace rnexecutorch