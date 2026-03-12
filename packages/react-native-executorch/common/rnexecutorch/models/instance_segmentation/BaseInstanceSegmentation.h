#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>
#include <optional>
#include <set>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/utils/computer_vision/Types.h>

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

  [[nodiscard("Registered non-void function")]] std::vector<types::Instance>
  generate(std::string imageSource, double confidenceThreshold,
           double iouThreshold, int32_t maxInstances,
           std::vector<int32_t> classIndices,
           bool returnMaskAtOriginalResolution, std::string methodName);

private:
  std::vector<types::Instance>
  postprocess(const std::vector<EValue> &tensors, cv::Size originalSize,
              cv::Size modelInputSize, double confidenceThreshold,
              double iouThreshold, int32_t maxInstances,
              const std::vector<int32_t> &classIndices,
              bool returnMaskAtOriginalResolution);

  // Data extraction helpers
  std::tuple<utils::computer_vision::BBox, float, int32_t>
  extractDetectionData(const float *bboxData, const float *scoresData,
                       int32_t index);

  // Helper functions for mask processing
  cv::Rect computeMaskCropRect(const utils::computer_vision::BBox &bboxModel,
                               cv::Size modelInputSize, cv::Size maskSize);

  cv::Rect addPaddingToRect(const cv::Rect &rect, cv::Size maskSize);

  cv::Mat applySigmoid(const cv::Mat &logits);

  cv::Mat
  warpToOriginalResolution(const cv::Mat &probMat, const cv::Rect &maskRect,
                           cv::Size originalSize, cv::Size maskSize,
                           const utils::computer_vision::BBox &bboxOriginal);

  cv::Mat thresholdToBinary(const cv::Mat &probMat);

  cv::Mat processMaskFromLogits(
      const cv::Mat &logitsMat, const utils::computer_vision::BBox &bboxModel,
      const utils::computer_vision::BBox &bboxOriginal, cv::Size modelInputSize,
      cv::Size originalSize, cv::Size maskSize, bool warpToOriginal,
      cv::Size &outSize);

  std::optional<types::Instance> processDetection(
      int32_t detectionIndex, const float *bboxData, const float *scoresData,
      const cv::Mat &logitsMat, cv::Size modelInputSize, cv::Size originalSize,
      float widthRatio, float heightRatio, double confidenceThreshold,
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
