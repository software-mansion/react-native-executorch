#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>
#include <optional>
#include <set>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/models/semantic_segmentation/Types.h>

namespace rnexecutorch {
namespace models::semantic_segmentation {
using namespace facebook;

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class BaseSemanticSegmentation : public VisionModel {
public:
  BaseSemanticSegmentation(const std::string &modelSource,
                           std::vector<float> normMean,
                           std::vector<float> normStd,
                           std::vector<std::string> allClasses,
                           std::shared_ptr<react::CallInvoker> callInvoker);

  // Async path: called from promiseHostFunction on a thread-pool thread.
  // Returns a jsi::Object via callInvoker (safe to block there).
  [[nodiscard("Registered non-void function")]] std::shared_ptr<jsi::Object>
  generateFromString(std::string imageSource,
                     std::set<std::string, std::less<>> classesOfInterest,
                     bool resize);

  // Sync path: called from visionHostFunction on the camera worklet thread.
  // Must NOT use callInvoker — returns a plain SegmentationResult that
  // visionHostFunction converts to JSI via getJsiValue.
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
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
  std::vector<std::string> allClasses_;

private:
  void initModelImageSize();

  TensorPtr preprocess(const std::string &imageSource, cv::Size &originalSize);

  std::shared_ptr<jsi::Object> populateDictionary(
      std::shared_ptr<OwningArrayBuffer> argmax,
      std::shared_ptr<
          std::unordered_map<std::string, std::shared_ptr<OwningArrayBuffer>>>
          classesToOutput);
};
} // namespace models::semantic_segmentation

REGISTER_CONSTRUCTOR(models::semantic_segmentation::BaseSemanticSegmentation,
                     std::string, std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
