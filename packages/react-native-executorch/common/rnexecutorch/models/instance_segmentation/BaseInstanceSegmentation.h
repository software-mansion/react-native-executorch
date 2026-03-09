#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>
#include <optional>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>
#include <unordered_set>

namespace rnexecutorch {
namespace models::instance_segmentation {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class BaseInstanceSegmentation : public BaseModel {
public:
  BaseInstanceSegmentation(const std::string &modelSource,
                           std::vector<float> normMean,
                           std::vector<float> normStd, bool applyNMS,
                           std::vector<std::string> labelNames,
                           std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::vector<types::InstanceMask>
  generate(std::string imageSource, double confidenceThreshold,
           double iouThreshold, int maxInstances,
           std::vector<int32_t> classIndices,
           bool returnMaskAtOriginalResolution, std::string methodName);

private:
  std::vector<types::InstanceMask>
  postprocess(const std::vector<EValue> &tensors, cv::Size originalSize,
              cv::Size modelInputSize, double confidenceThreshold,
              double iouThreshold, int maxInstances,
              const std::vector<int32_t> &classIndices,
              bool returnMaskAtOriginalResolution);

  float intersectionOverUnion(const types::InstanceMask &a,
                              const types::InstanceMask &b);

  std::vector<types::InstanceMask>
  nonMaxSuppression(std::vector<types::InstanceMask> instances,
                    double iouThreshold);

  // Member variables
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
  bool applyNMS_;
  std::vector<std::string> labelNames_;
  cv::Size modelImageSize{0, 0};
  std::unordered_set<std::string> avalivableMethods_;
  std::string currentlyLoadedMethod_;
};
} // namespace models::instance_segmentation

REGISTER_CONSTRUCTOR(models::instance_segmentation::BaseInstanceSegmentation,
                     std::string, std::vector<float>, std::vector<float>, bool,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
