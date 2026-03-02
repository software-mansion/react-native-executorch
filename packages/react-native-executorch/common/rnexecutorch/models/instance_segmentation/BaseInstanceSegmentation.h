#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>
#include <optional>
#include <set>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::instance_segmentation {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class BaseInstanceSegmentation : public BaseModel {
public:
  BaseInstanceSegmentation(const std::string &modelSource,
                           const std::string &postprocessorType,
                           std::vector<float> normMean,
                           std::vector<float> normStd, bool applyNMS,
                           std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::vector<types::InstanceMask>
  generate(std::string imageSource, double confidenceThreshold,
           double iouThreshold, int maxInstances,
           std::vector<int32_t> classIndices,
           bool returnMaskAtOriginalResolution, int32_t inputSize);

private:
  std::vector<types::InstanceMask>
  postprocess(const std::vector<EValue> &tensors, cv::Size originalSize,
              cv::Size modelInputSize, double confidenceThreshold,
              double iouThreshold, int maxInstances,
              const std::vector<int32_t> &classIndices,
              bool returnMaskAtOriginalResolution);

  std::vector<types::InstanceMask>
  postprocessRFDetr(const std::vector<EValue> &tensors, cv::Size originalSize,
                    cv::Size modelInputSize, double confidenceThreshold,
                    const std::set<int32_t> &allowedClasses,
                    bool returnMaskAtOriginalResolution);

  std::vector<types::InstanceMask>
  postprocessYOLO(const std::vector<EValue> &tensors, cv::Size originalSize,
                  cv::Size modelInputSize, double confidenceThreshold,
                  const std::set<int32_t> &allowedClasses,
                  bool returnMaskAtOriginalResolution);

  std::set<int32_t>
  createAllowedClassesSet(const std::vector<int32_t> &classIndices);

  std::vector<uint8_t> applySigmoidAndThreshold(const float *logits, int size);

  float intersectionOverUnion(const types::InstanceMask &a,
                              const types::InstanceMask &b);

  std::vector<types::InstanceMask>
  nonMaxSuppression(std::vector<types::InstanceMask> instances,
                    double iouThreshold);

  std::vector<uint8_t> resizeAndCropMask(const std::vector<uint8_t> &mask,
                                         int maskWidth, int maskHeight,
                                         cv::Size originalSize, float x1,
                                         float y1, float x2, float y2,
                                         bool returnAtOriginalResolution,
                                         int &outWidth, int &outHeight);

  std::vector<types::InstanceMask>
  finalizeInstances(std::vector<types::InstanceMask> instances,
                    double iouThreshold, int maxInstances);

  std::string getMethodName(int32_t inputSize) const {
    if (inputSize == 0) {
      return "forward"; // Single-method model
    }
    return "forward_" + std::to_string(inputSize); // Multi-method model
  }

  // Member variables
  std::string postprocessorType_;
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
  bool applyNMS_;
  cv::Size modelImageSize{0, 0};
};
} // namespace models::instance_segmentation

REGISTER_CONSTRUCTOR(models::instance_segmentation::BaseInstanceSegmentation,
                     std::string, std::string, std::vector<float>,
                     std::vector<float>, bool,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
