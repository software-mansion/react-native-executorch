#pragma once

#include <optional>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/object_detection/Utils.h>

namespace rnexecutorch {
namespace models::object_detection {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class ObjectDetection : public BaseModel {
public:
  ObjectDetection(const std::string &modelSource,
                  std::shared_ptr<react::CallInvoker> callInvoker);
  ObjectDetection(const std::string &modelSource, std::vector<float> normMean,
                  std::vector<float> normStd,
                  std::shared_ptr<react::CallInvoker> callInvoker);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generate(std::string imageSource, double detectionThreshold,
           std::vector<std::string> labelNames);

private:
  std::vector<types::Detection>
  postprocess(const std::vector<EValue> &tensors, cv::Size originalSize,
              double detectionThreshold,
              const std::vector<std::string> &labelNames);

  cv::Size modelImageSize{0, 0};
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
};
} // namespace models::object_detection

REGISTER_CONSTRUCTOR(models::object_detection::ObjectDetection, std::string,
                     std::vector<float>, std::vector<float>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch