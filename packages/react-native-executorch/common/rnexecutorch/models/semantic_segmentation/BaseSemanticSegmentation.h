#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>
#include <optional>
#include <set>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/models/image_segmentation/Types.h>

namespace rnexecutorch {
namespace models::semantic_segmentation {
using namespace facebook;

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class BaseSemanticSegmentation : public BaseModel {
public:
  BaseSemanticSegmentation(const std::string &modelSource,
                           std::vector<float> normMean,
                           std::vector<float> normStd,
                           std::vector<std::string> allClasses,
                           std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::shared_ptr<jsi::Object>
  generate(std::string imageSource,
           std::set<std::string, std::less<>> classesOfInterest, bool resize);

protected:
  cv::Mat preprocessFrame(const cv::Mat &frame) const override;

  virtual SegmentationResult
  postprocess(const Tensor &tensor, cv::Size originalSize,
              std::vector<std::string> &allClasses,
              std::set<std::string, std::less<>> &classesOfInterest,
              bool resize);

  cv::Size modelImageSize;
  std::size_t numModelPixels;
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
  std::vector<std::string> allClasses_;

private:
  void initModelImageSize();

  SegmentationResult runInference(
      cv::Mat image, cv::Size originalSize, std::vector<std::string> allClasses,
      std::set<std::string, std::less<>> classesOfInterest, bool resize);

  TensorPtr preprocessFromString(const std::string &imageSource,
                                 cv::Size &originalSize);
};
} // namespace models::semantic_segmentation

REGISTER_CONSTRUCTOR(models::semantic_segmentation::BaseSemanticSegmentation,
                     std::string, std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
