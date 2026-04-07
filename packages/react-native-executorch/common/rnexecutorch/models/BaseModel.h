#pragma once

#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <executorch/extension/module/module.h>
#include <jsi/jsi.h>
#include <opencv2/core/types.hpp>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/host_objects/JSTensorViewOut.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

namespace rnexecutorch {
namespace models {
using namespace facebook;
using executorch::extension::module::Module;
using executorch::runtime::EValue;
using executorch::runtime::Result;

class BaseModel {
public:
  virtual ~BaseModel() = default;
  BaseModel(BaseModel &&) = default;
  BaseModel &operator=(BaseModel &&) = default;
  BaseModel(
      const std::string &modelSource,
      std::shared_ptr<react::CallInvoker> callInvoker,
      Module::LoadMode loadMode = Module::LoadMode::MmapUseMlockIgnoreErrors);
  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;
  [[nodiscard("Registered non-void function")]] std::vector<int32_t>
  getInputShape(std::string method_name, int32_t index) const;
  std::vector<std::vector<int32_t>>
  getAllInputShapes(std::string methodName = "forward") const;
  [[nodiscard("Registered non-void function")]] std::vector<JSTensorViewOut>
  forwardJS(std::vector<JSTensorViewIn> tensorViewVec) const;
  Result<std::vector<EValue>> forward(const EValue &input_value) const;
  Result<std::vector<EValue>>
  forward(const std::vector<EValue> &input_value) const;
  Result<std::vector<EValue>>
  execute(const std::string &methodName,
          const std::vector<EValue> &input_value) const;
  Result<executorch::runtime::MethodMeta>
  getMethodMeta(const std::string &methodName) const;

protected:
  // If possible, models should not use the JS runtime to keep JSI internals
  // away from logic, however, sometimes this would incur too big of a penalty
  // (unnecessary copies instead of working on JS memory). In this case
  // CallInvoker can be used to get jsi::Runtime, and use it in a safe manner.
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<Module> module_;

  std::size_t memorySizeLowerBound{0};

  /**
   * @brief Ensures the specified method is loaded, unloading any previous
   * method if necessary.
   *
   * This helper is useful for models that support multiple methods with
   * different input sizes (e.g., "forward_384", "forward_512", "forward_640").
   *
   * @param methodName Name of the method to load (e.g., "forward",
   * "forward_384").
   * @throws RnExecutorchError if the method cannot be loaded or if methodName
   * is empty.
   */
  void ensureMethodLoaded(const std::string &methodName);

  /**
   * @brief Get model input spatial dimensions for a specific method.
   *
   * Useful for multi-method models with different input sizes per method.
   * Returns the last two dimensions of the input shape as cv::Size.
   *
   * @param methodName Method to query (uses currentlyLoadedMethod_ if empty)
   * @return Size (width, height) of the model input for the specified method
   * @throws RnExecutorchError if method metadata cannot be retrieved
   */
  cv::Size getModelInputSize(const std::string &methodName = "") const;

  /**
   * @brief Validate and get input shape for model
   *
   * Validates that the model has at least one input tensor and that the first
   * input has the minimum required dimensions.
   *
   * @param methodName Method to get shapes for (default: "forward")
   * @param minDimensions Minimum expected dimensions (default: 2)
   * @throws RnExecutorchError if validation fails (no inputs or insufficient
   * dimensions)
   * @return The first input shape vector
   */
  std::vector<int32_t>
  validateAndGetInputShape(const std::string &methodName = "forward",
                          size_t minDimensions = 2) const;

  /// Name of the currently loaded method (for multi-method models).
  std::string currentlyLoadedMethod_;

private:
  std::vector<int32_t>
  getTensorShape(const executorch::aten::Tensor &tensor) const;
};
} // namespace models

REGISTER_CONSTRUCTOR(models::BaseModel, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
