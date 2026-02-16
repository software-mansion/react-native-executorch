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
namespace models::image_segmentation {
using namespace facebook;

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class BaseImageSegmentation : public BaseModel {
public:
  BaseImageSegmentation(const std::string &modelSource,
                        std::shared_ptr<react::CallInvoker> callInvoker);

  BaseImageSegmentation(const std::string &modelSource,
                        std::vector<float> normMean, std::vector<float> normStd,
                        std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::shared_ptr<jsi::Object>
  generate(std::string imageSource, std::vector<std::string> allClasses,
           std::set<std::string, std::less<>> classesOfInterest, bool resize);

protected:
  virtual TensorPtr preprocess(const std::string &imageSource,
                               cv::Size &originalSize);
  virtual std::shared_ptr<jsi::Object>
  postprocess(const Tensor &tensor, cv::Size originalSize,
              std::vector<std::string> allClasses,
              std::set<std::string, std::less<>> classesOfInterest,
              bool resize);

  cv::Size modelImageSize;
  std::size_t numModelPixels;
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;

private:
  void initModelImageSize();

protected:
  std::shared_ptr<jsi::Object> populateDictionary(
      std::shared_ptr<OwningArrayBuffer> argmax,
      std::shared_ptr<std::unordered_map<std::string_view,
                                         std::shared_ptr<OwningArrayBuffer>>>
          classesToOutput);
};
} // namespace models::image_segmentation
} // namespace rnexecutorch
