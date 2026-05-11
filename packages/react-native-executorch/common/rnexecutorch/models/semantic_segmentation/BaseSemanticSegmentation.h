#pragma once

#include <opencv2/opencv.hpp>
#include <optional>
#include <set>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/models/semantic_segmentation/Types.h>

namespace rnexecutorch {
namespace models::semantic_segmentation {
using namespace facebook;

using executorch::aten::Tensor;

class BaseSemanticSegmentation : public VisionModel {
public:
  BaseSemanticSegmentation(const std::string &modelSource,
                           std::vector<float> normMean,
                           std::vector<float> normStd,
                           std::vector<std::string> allClasses,
                           std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]]
  semantic_segmentation::SegmentationResult
  generateFromString(std::string imageSource,
                     std::set<std::string, std::less<>> classesOfInterest,
                     bool resize);

  [[nodiscard("Registered non-void function")]]
  semantic_segmentation::SegmentationResult
  generateFromPixels(JSTensorViewIn pixelData,
                     std::set<std::string, std::less<>> classesOfInterest,
                     bool resize);

  [[nodiscard("Registered non-void function")]]
  semantic_segmentation::SegmentationResult
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData,
                    std::set<std::string, std::less<>> classesOfInterest,
                    bool resize);

protected:
  virtual semantic_segmentation::SegmentationResult
  computeResult(const Tensor &tensor, cv::Size originalSize,
                std::vector<std::string> &allClasses,
                std::set<std::string, std::less<>> &classesOfInterest,
                bool resize);
  std::size_t numModelPixels;
  std::vector<std::string> allClasses_;

private:
  void initModelImageSize();

  semantic_segmentation::SegmentationResult
  runInference(cv::Mat image, cv::Size originalSize,
               std::set<std::string, std::less<>> &classesOfInterest,
               bool resize);
};
} // namespace models::semantic_segmentation

REGISTER_CONSTRUCTOR(models::semantic_segmentation::BaseSemanticSegmentation,
                     std::string, std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
