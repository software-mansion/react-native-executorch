#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>
#include <optional>
#include <set>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/utils/computer_vision/Types.h>

namespace rnexecutorch {
namespace models::instance_segmentation {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class BaseInstanceSegmentation : public VisionModel {
public:
  BaseInstanceSegmentation(const std::string &modelSource,
                           std::vector<float> normMean,
                           std::vector<float> normStd, bool applyNMS,
                           std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::vector<types::Instance>
  generateFromString(std::string imageSource, double confidenceThreshold,
                     double iouThreshold, int32_t maxInstances,
                     std::vector<int32_t> classIndices,
                     bool returnMaskAtOriginalResolution,
                     std::string methodName);

  [[nodiscard("Registered non-void function")]] std::vector<types::Instance>
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData,
                    double confidenceThreshold, double iouThreshold,
                    int32_t maxInstances, std::vector<int32_t> classIndices,
                    bool returnMaskAtOriginalResolution,
                    std::string methodName);

  [[nodiscard("Registered non-void function")]] std::vector<types::Instance>
  generateFromPixels(JSTensorViewIn tensorView, double confidenceThreshold,
                     double iouThreshold, int32_t maxInstances,
                     std::vector<int32_t> classIndices,
                     bool returnMaskAtOriginalResolution,
                     std::string methodName);

protected:
  cv::Size modelInputSize() const override;

private:
  std::vector<types::Instance> runInference(
      const cv::Mat &image, double confidenceThreshold, double iouThreshold,
      int32_t maxInstances, const std::vector<int32_t> &classIndices,
      bool returnMaskAtOriginalResolution, const std::string &methodName);

  TensorPtr buildInputTensor(const cv::Mat &image);

  std::vector<types::Instance>
  collectInstances(const std::vector<EValue> &tensors, cv::Size originalSize,
                   cv::Size modelInputSize, double confidenceThreshold,
                   const std::vector<int32_t> &classIndices,
                   bool returnMaskAtOriginalResolution);

  void validateOutputTensors(const std::vector<EValue> &tensors) const;

  std::tuple<utils::computer_vision::BBox, float, int32_t>
  extractDetectionData(const float *bboxData, const float *scoresData,
                       int32_t index);

  cv::Rect computeMaskCropRect(const utils::computer_vision::BBox &bboxModel,
                               cv::Size modelInputSize, cv::Size maskSize);

  cv::Rect addPaddingToRect(const cv::Rect &rect, cv::Size maskSize);

  cv::Mat
  warpToOriginalResolution(const cv::Mat &probMat, const cv::Rect &maskRect,
                           cv::Size originalSize, cv::Size maskSize,
                           const utils::computer_vision::BBox &bboxOriginal);

  cv::Mat thresholdToBinary(const cv::Mat &probMat);

  std::vector<types::Instance>
  finalizeInstances(std::vector<types::Instance> instances, double iouThreshold,
                    int32_t maxInstances) const;

  cv::Mat processMaskFromLogits(
      const cv::Mat &logitsMat, const utils::computer_vision::BBox &bboxModel,
      const utils::computer_vision::BBox &bboxOriginal, cv::Size modelInputSize,
      cv::Size originalSize, bool warpToOriginal);

  bool applyNMS_;
};
} // namespace models::instance_segmentation

REGISTER_CONSTRUCTOR(models::instance_segmentation::BaseInstanceSegmentation,
                     std::string, std::vector<float>, std::vector<float>, bool,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
