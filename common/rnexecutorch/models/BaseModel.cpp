#include "BaseModel.h"

#include <filesystem>

#include <rnexecutorch/Log.h>

namespace rnexecutorch {

using namespace facebook;
using ::executorch::extension::Module;
using ::executorch::runtime::Error;

BaseModel::BaseModel(const std::string &modelSource,
                     std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker),
      module(std::make_unique<Module>(
          modelSource, Module::LoadMode::MmapUseMlockIgnoreErrors)) {
  Error loadError = module->load();
  if (loadError != Error::Ok) {
    throw std::runtime_error("Couldn't load the model, error: " +
                             std::to_string(static_cast<uint32_t>(loadError)));
  }
  // We use the size of the model .pte file as the lower bound for the memory
  // occupied by the ET module. This is not the whole size however, the module
  // also allocates planned memory (for ET execution) and backend-specific
  // memory (e.g. what XNNPACK operates on).
  std::filesystem::path modelPath{modelSource};
  memorySizeLowerBound = std::filesystem::file_size(modelPath);
}

std::vector<std::vector<int32_t>> BaseModel::getInputShape() {
  if (!module) {
    throw std::runtime_error("getInputShape called on unloaded model");
  }
  auto method_meta = module->method_meta("forward");

  if (!method_meta.ok()) {
    throw std::runtime_error("Failed to load forward");
  }
  std::vector<std::vector<int32_t>> output;
  std::size_t numInputs = method_meta->num_inputs();
  output.reserve(numInputs);
  for (std::size_t input = 0; input < numInputs; ++input) {
    auto input_meta = method_meta->input_tensor_meta(input);
    if (!input_meta.ok()) {
      throw std::runtime_error("Failed to load forward input");
    }
    auto shape = input_meta->sizes();
    output.emplace_back(std::vector<int32_t>(shape.begin(), shape.end()));
  }
  return output;
}

std::size_t BaseModel::getMemoryLowerBound() { return memorySizeLowerBound; }

void BaseModel::unloadModule() { module.reset(nullptr); }

Result<std::vector<EValue>> BaseModel::forwardET(const EValue &input_value) {
  if (!module) {
    throw std::runtime_error("Forward called on unloaded model");
  }
  return module->forward(input_value);
}

} // namespace rnexecutorch