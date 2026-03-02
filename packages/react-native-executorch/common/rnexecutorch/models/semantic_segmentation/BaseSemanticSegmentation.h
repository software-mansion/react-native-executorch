#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>
#include <optional>
#include <set>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/BaseModel.h>

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
  virtual TensorPtr preprocess(const std::string &imageSource,
                               cv::Size &originalSize);
  virtual std::shared_ptr<jsi::Object>
  postprocess(const Tensor &tensor, cv::Size originalSize,
              std::vector<std::string> &allClasses,
              std::set<std::string, std::less<>> &classesOfInterest,
              bool resize);

  cv::Size modelImageSize;
  std::size_t numModelPixels;
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
  std::vector<std::string> allClasses_;

  std::shared_ptr<jsi::Object> populateDictionary(
      std::shared_ptr<OwningArrayBuffer> argmax,
      std::shared_ptr<std::unordered_map<std::string_view,
                                         std::shared_ptr<OwningArrayBuffer>>>
          classesToOutput);

private:
  void initModelImageSize();
};
} // namespace models::semantic_segmentation

REGISTER_CONSTRUCTOR(models::semantic_segmentation::BaseSemanticSegmentation,
                     std::string, std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
