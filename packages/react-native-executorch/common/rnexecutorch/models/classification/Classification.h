#pragma once

#include <optional>
#include <unordered_map>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/VisionModel.h>

namespace rnexecutorch {
namespace models::classification {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class Classification : public VisionModel {
public:
  Classification(const std::string &modelSource, std::vector<float> normMean,
                 std::vector<float> normStd,
                 std::vector<std::string> labelNames,
                 std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::unordered_map<
      std::string_view, float>
  generateFromString(std::string imageSource);

  [[nodiscard("Registered non-void function")]] std::unordered_map<
      std::string_view, float>
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData);

  [[nodiscard("Registered non-void function")]] std::unordered_map<
      std::string_view, float>
  generateFromPixels(JSTensorViewIn pixelData);

private:
  std::unordered_map<std::string_view, float> runInference(cv::Mat image);

  std::unordered_map<std::string_view, float> postprocess(const Tensor &tensor);

  std::vector<std::string> labelNames_;
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
};
} // namespace models::classification

REGISTER_CONSTRUCTOR(models::classification::Classification, std::string,
                     std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
