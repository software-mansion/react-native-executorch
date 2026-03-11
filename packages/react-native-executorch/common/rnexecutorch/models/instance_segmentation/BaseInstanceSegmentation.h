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
                           std::vector<float> normMean,
                           std::vector<float> normStd, bool applyNMS,
                           std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::vector<types::InstanceMask>
  generate(std::string imageSource, double confidenceThreshold,
           double iouThreshold, int32_t maxInstances,
           std::vector<int32_t> classIndices,
           bool returnMaskAtOriginalResolution, std::string methodName);

private:
  std::vector<types::InstanceMask>
  postprocess(const std::vector<EValue> &tensors, cv::Size originalSize,
              cv::Size modelInputSize, double confidenceThreshold,
              double iouThreshold, int32_t maxInstances,
              const std::vector<int32_t> &classIndices,
              bool returnMaskAtOriginalResolution);

  cv::Mat processMaskFromLogits(const cv::Mat &logitsMat, float x1, float y1,
                                float x2, float y2, cv::Size modelInputSize,
                                cv::Size originalSize, int32_t maskW,
                                int32_t maskH, int32_t bboxW, int32_t bboxH,
                                float origX1, float origY1, bool warpToOriginal,
                                int32_t &outWidth, int32_t &outHeight);

  std::optional<types::InstanceMask>
  processDetection(int32_t detectionIndex, const float *bboxData,
                   const float *scoresData, const float *maskData,
                   int32_t maskH, int32_t maskW, cv::Size modelInputSize,
                   cv::Size originalSize, float widthRatio, float heightRatio,
                   double confidenceThreshold,
                   const std::set<int32_t> &allowedClasses,
                   bool returnMaskAtOriginalResolution);

  // Member variables
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
  bool applyNMS_;
  std::string currentlyLoadedMethod_;
};
} // namespace models::instance_segmentation

REGISTER_CONSTRUCTOR(models::instance_segmentation::BaseInstanceSegmentation,
                     std::string, std::vector<float>, std::vector<float>, bool,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
