#include "BaseModel.h"

#include <filesystem>

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch {

using namespace facebook;
using namespace executorch::extension;
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

std::vector<int32_t> BaseModel::getInputShape(std::string method_name,
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

std::vector<std::vector<int32_t>>
BaseModel::getAllInputShapes(std::string methodName) {
  if (!module) {
    throw std::runtime_error("getInputShape called on unloaded model");
  }
  auto method_meta = module->method_meta(methodName);

  if (!method_meta.ok()) {
    throw std::runtime_error("Failed to load method: " + methodName);
  }
  std::vector<std::vector<int32_t>> output;
  std::size_t numInputs = method_meta->num_inputs();
  output.reserve(numInputs);
  for (std::size_t input = 0; input < numInputs; ++input) {
    auto input_meta = method_meta->input_tensor_meta(input);
    if (!input_meta.ok()) {
      throw std::runtime_error(
          "Failed to load input no: " + std::to_string(input) + " for method " +
          methodName);
    }
    auto shape = input_meta->sizes();
    output.emplace_back(std::vector<int32_t>(shape.begin(), shape.end()));
  }
  return output;
}

std::vector<std::shared_ptr<OwningArrayBuffer>>
BaseModel::forward(std::vector<JsiTensorView> tensorViewVec) {
  if (!module) {
    throw std::runtime_error("Forward called on an unloaded module!");
  }
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
    auto tensorPtr =
        make_tensor_ptr(currTensorView.shape, currTensorView.dataPtr,
                        currTensorView.scalarType);
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

Result<std::vector<EValue>> BaseModel::forward(const EValue &input_evalue) {
  if (!module) {
    throw std::runtime_error("Forward called on unloaded model!");
  }
  return module->forward(input_evalue);
}

Result<std::vector<EValue>>
BaseModel::forward(const std::vector<EValue> &input_evalues) {
  if (!module) {
    throw std::runtime_error("Forward called on unloaded model!");
  }
  return module->forward(input_evalues);
}

std::size_t BaseModel::getMemoryLowerBound() { return memorySizeLowerBound; }

void BaseModel::unload() { module.reset(nullptr); }

} // namespace rnexecutorch