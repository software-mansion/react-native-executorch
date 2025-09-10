#include "BaseModel.h"

#include <executorch/extension/tensor/tensor.h>
#include <filesystem>
#include <stdexcept>

namespace rnexecutorch::models {

using namespace facebook;
using namespace executorch::extension;
using ::executorch::runtime::Error;

BaseModel::BaseModel(const std::string &modelSource,
                     std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker),
      module_(std::make_unique<Module>(
          modelSource, Module::LoadMode::MmapUseMlockIgnoreErrors)) {
  Error loadError = module_->load();
  if (loadError != Error::Ok) {
    throw std::runtime_error("Failed to load model: Error " +
                             std::to_string(static_cast<int>(loadError)));
  }
  // We use the size of the model .pte file as the lower bound for the memory
  // occupied by the ET module. This is not the whole size however, the module
  // also allocates planned memory (for ET execution) and backend-specific
  // memory (e.g. what XNNPACK operates on).
  std::filesystem::path modelPath{modelSource};
  memorySizeLowerBound = std::filesystem::file_size(modelPath);
}

std::vector<int32_t> BaseModel::getInputShape(std::string method_name,
                                              int32_t index) {
  if (!module_) {
    throw std::runtime_error("Model not loaded: Cannot get input shape");
  }

  auto method_meta = module_->method_meta(method_name);
  if (!method_meta.ok()) {
    throw std::runtime_error(
        "Failed to get metadata for method '" + method_name + "': Error " +
        std::to_string(static_cast<int>(method_meta.error())));
  }

  auto input_meta = method_meta->input_tensor_meta(index);
  if (!input_meta.ok()) {
    throw std::runtime_error(
        "Failed to get metadata for input tensor at index " +
        std::to_string(index) + " in method '" + method_name + "': Error " +
        std::to_string(static_cast<int>(input_meta.error())));
  }

  auto sizes = input_meta->sizes();
  std::vector<int32_t> input_shape(sizes.begin(), sizes.end());
  return input_shape;
}

std::vector<std::vector<int32_t>>
BaseModel::getAllInputShapes(std::string methodName) {
  if (!module_) {
    throw std::runtime_error("Model not loaded: Cannot get all input shapes");
  }

  auto method_meta = module_->method_meta(methodName);
  if (!method_meta.ok()) {
    throw std::runtime_error(
        "Failed to get metadata for method '" + methodName + "': Error " +
        std::to_string(static_cast<int>(method_meta.error())));
  }
  std::vector<std::vector<int32_t>> output;
  std::size_t numInputs = method_meta->num_inputs();
  output.reserve(numInputs);
  for (std::size_t input = 0; input < numInputs; ++input) {
    auto input_meta = method_meta->input_tensor_meta(input);
    if (!input_meta.ok()) {
      throw std::runtime_error(
          "Failed to get metadata for input tensor at index " +
          std::to_string(input) + " in method '" + methodName + "': Error " +
          std::to_string(static_cast<int>(input_meta.error())));
    }
    auto shape = input_meta->sizes();
    output.emplace_back(std::vector<int32_t>(shape.begin(), shape.end()));
  }
  return output;
}

/// @brief This method is a forward wrapper that is created solely to be exposed
/// to JS. It is not meant to be used within C++. If you want to call forward
/// from C++ on a BaseModel, please use BaseModel::forward.
std::vector<JSTensorViewOut>
BaseModel::forwardJS(std::vector<JSTensorViewIn> tensorViewVec) {
  if (!module_) {
    throw std::runtime_error("Model not loaded: Cannot perform forward pass");
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
        make_tensor_ptr(currTensorView.sizes, currTensorView.dataPtr,
                        currTensorView.scalarType);
    tensorPtrs.emplace_back(tensorPtr);
    evalues.emplace_back(*tensorPtr); // Dereference TensorPtr to get Tensor,
                                      // which implicitly converts to EValue
  }

  auto result = module_->forward(evalues);
  if (!result.ok()) {
    throw std::runtime_error("Forward pass failed: Error " +
                             std::to_string(static_cast<int>(result.error())));
  }

  auto &outputs = result.get();
  std::vector<JSTensorViewOut> output;
  output.reserve(outputs.size());

  // Convert ET outputs to a vector of JSTensorViewOut which are later
  // converted to JSI types via JsiConversions.h
  for (size_t i = 0; i < outputs.size(); i++) {
    auto &outputTensor = outputs[i].toTensor();
    std::vector<int32_t> sizes = getTensorShape(outputTensor);
    size_t bufferSize = outputTensor.numel() * outputTensor.element_size();
    auto buffer = std::make_shared<OwningArrayBuffer>(bufferSize);
    std::memcpy(buffer->data(), outputTensor.const_data_ptr(), bufferSize);
    auto jsTensor = JSTensorViewOut(sizes, outputTensor.scalar_type(), buffer);
    output.emplace_back(jsTensor);
  }
  return output;
}

Result<executorch::runtime::MethodMeta>
BaseModel::getMethodMeta(const std::string &methodName) {
  if (!module_) {
    throw std::runtime_error("Model not loaded: Cannot get method meta!");
  }
  return module_->method_meta(methodName);
}

Result<std::vector<EValue>>
BaseModel::forward(const EValue &input_evalue) const {
  if (!module_) {
    throw std::runtime_error("Model not loaded: Cannot perform forward pass");
  }
  return module_->forward(input_evalue);
}

Result<std::vector<EValue>>
BaseModel::forward(const std::vector<EValue> &input_evalues) const {
  if (!module_) {
    throw std::runtime_error("Model not loaded: Cannot perform forward pass");
  }
  return module_->forward(input_evalues);
}

Result<std::vector<EValue>>
BaseModel::execute(const std::string &methodName,
                   const std::vector<EValue> &input_value) {
  if (!module_) {
    throw std::runtime_error("Model not loaded, cannot run execute.");
  }
  return module_->execute(methodName, input_value);
}

std::size_t BaseModel::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

void BaseModel::unload() noexcept { module_.reset(nullptr); }

std::vector<int32_t>
BaseModel::getTensorShape(const executorch::aten::Tensor &tensor) {
  auto sizes = tensor.sizes();
  return std::vector<int32_t>(sizes.begin(), sizes.end());
}

} // namespace rnexecutorch::models
