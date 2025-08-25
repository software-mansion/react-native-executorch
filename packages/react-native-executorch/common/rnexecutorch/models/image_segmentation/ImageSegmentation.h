#pragma once

#include <set>
#include <utility>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/image_segmentation/Constants.h>

namespace rnexecutorch {
namespace models::image_segmentation {
using namespace facebook;

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class ImageSegmentation : public BaseModel {
public:
  ImageSegmentation(const std::string &modelSource,
                    std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<jsi::Object>
  generate(std::string imageSource,
           std::set<std::string, std::less<>> classesOfInterest, bool resize);

private:
  std::shared_ptr<jsi::Object>
  postprocess(const Tensor &tensor, cv::Size originalSize,
              std::set<std::string, std::less<>> classesOfInterest,
              bool resize);
  std::shared_ptr<jsi::Object> populateDictionary(
      std::shared_ptr<OwningArrayBuffer> argmax,
      std::shared_ptr<std::unordered_map<std::string_view,
                                         std::shared_ptr<OwningArrayBuffer>>>
          classesToOutput);

  static constexpr std::size_t numClasses{
      constants::kDeeplabV3Resnet50Labels.size()};
  cv::Size modelImageSize;
  std::size_t numModelPixels;
};
} // namespace models::image_segmentation

REGISTER_CONSTRUCTOR(models::image_segmentation::ImageSegmentation, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch