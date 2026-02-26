#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::instance_segmentation {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class InstanceSegmentation : public BaseModel {
public:
  InstanceSegmentation(const std::string &modelSource,
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

  cv::Size modelImageSize{0, 0};
};
} // namespace models::instance_segmentation

REGISTER_CONSTRUCTOR(models::instance_segmentation::InstanceSegmentation,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
