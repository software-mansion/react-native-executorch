#include <rnexecutorch/models/BaseModel.h>

#include <rnexecutorch/Log.h>

namespace rnexecutorch {

using ::executorch::extension::Module;
using ::executorch::runtime::Error;

BaseModel::BaseModel(const std::string &modelSource,
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

std::vector<std::vector<int32_t>> BaseModel::getInputShape() {
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

} // namespace rnexecutorch