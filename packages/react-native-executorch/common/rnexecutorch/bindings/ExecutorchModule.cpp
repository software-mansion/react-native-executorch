#include "ExecutorchModule.h"

#include <executorch/extension/module/module.h>
#include <rnexecutorch/Log.h>
#include <sstream>

namespace rnexecutorch {

using namespace executorch::aten;
using namespace executorch::extension;
using namespace executorch::runtime;
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
  std::filesystem::path modelPath{modelSource};
  memorySizeLowerBound = std::filesystem::file_size(modelPath);
}

void ExecutorchModule::unload() { module.reset(nullptr); }

std::size_t ExecutorchModule::getMemoryLowerBound() {
  return memorySizeLowerBound;
}

std::vector<std::shared_ptr<OwningArrayBuffer>>
ExecutorchModule::forward(std::vector<JsiTensorView> tensorViewVec) {
  std::vector<executorch::runtime::EValue> evalues;
  evalues.reserve(tensorViewVec.size());
  // Because EValue doesn't hold to the dynamic data and metadata from
  // TensorPtr, we need to make sure that the TensorPtr for each EValue is valid
  // as long as that EValue is in use. Therefore we create a vec solely for
  // keeping references to the TensorPtr
  std::vector<TensorPtr> tensorPtrs;
  tensorPtrs.reserve(evalues.size());

  for (size_t i = 0; i < tensorViewVec.size(); i++) {
    const auto &currTensorView = tensorViewVec[i];
    auto tensorPtr = make_tensor_ptr(currTensorView.shape,
                                     currTensorView.dataPtr, ScalarType::Float);
    tensorPtrs.emplace_back(tensorPtr);
    evalues.emplace_back(*tensorPtr); // Dereference TensorPtr to get Tensor,
                                      // which implicitly converts to EValue
  }

  auto result = module->forward(evalues);
  if (!result.ok()) {
    throw std::runtime_error("Forward error: " +
                             std::to_string(static_cast<int>(result.error())));
  }

  auto &outputs = result.get();
  std::vector<std::shared_ptr<OwningArrayBuffer>> output;
  output.reserve(outputs.size());

  // Convert ET outputs to a vector of ArrayBuffers which are later
  // converted to JSI array via JsiConversions.h
  for (size_t i = 0; i < outputs.size(); i++) {
    auto &outputTensor = outputs[i].toTensor();

    size_t bufferSize = outputTensor.numel() * outputTensor.element_size();
    auto buffer = std::make_shared<OwningArrayBuffer>(bufferSize);
    std::memcpy(buffer->data(), outputTensor.const_data_ptr(), bufferSize);
    output.emplace_back(buffer);
  }
  return output;
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