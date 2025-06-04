#include "ExecutorchModule.h"

#include <rnexecutorch/Log.h>
#include <sstream>

namespace rnexecutorch {

using ::executorch::extension::Module;
using ::executorch::runtime::Error;
using namespace facebook;

ExecutorchModule::ExecutorchModule(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : module(std::make_unique<Module>(
          modelSource, Module::LoadMode::MmapUseMlockIgnoreErrors)),
      callInvoker(callInvoker) {
  Error loadError = module->load();
  if (loadError != Error::Ok) {
    throw std::runtime_error("Couldn't load the model, error: " +
                             std::to_string(static_cast<uint32_t>(loadError)));
  }
}

std::vector<int32_t> ExecutorchModule::getInputShape(std::string method_name,
                                                     int index) {
  auto method_meta = module->method_meta(method_name);
  if (!method_meta.ok()) {
    throw std::runtime_error("Failed to load method with name " + method_name);
  }

  std::vector<int32_t> input_shape;
  auto input_meta = method_meta->input_tensor_meta(index);
  if (!input_meta.ok()) {
    throw std::runtime_error("Failed to load forward input " +
                             std::to_string(index));
  }

  for (auto size : input_meta->sizes()) {
    input_shape.push_back(size);
  }
  return input_shape;
}
} // namespace rnexecutorch