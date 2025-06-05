#include "ExecutorchModule.h"

#include <executorch/extension/module/module.h>
#include <rnexecutorch/Log.h>
#include <sstream>

namespace rnexecutorch {

using ::executorch::extension::Module;
using namespace executorch::aten;
using namespace executorch::extension;
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

int ExecutorchModule::forward(std::vector<JsiTensorView> tensorViewVec) {
  auto currTensor = tensorViewVec[0];
  auto myTensor =
      make_tensor_ptr(currTensor.shape, currTensor.dataPtr, ScalarType::Float);
  auto result = module->forward(myTensor);
  if (!result.ok()) {
    std::string errorStr = std::to_string(static_cast<int>(result.error()));
    log(LOG_LEVEL::Debug, errorStr.c_str());
    throw std::runtime_error("Failed to run forward! Error: " + errorStr);
  }
  return 1;
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