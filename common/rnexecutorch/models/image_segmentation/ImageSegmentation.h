#pragma once

#include <set>
#include <utility>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/image_segmentation/Constants.h>

namespace rnexecutorch {
using namespace facebook;

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class ImageSegmentation : public BaseModel {
public:
  ImageSegmentation(const std::string &modelSource,
                    std::shared_ptr<react::CallInvoker> callInvoker);
  std::unique_ptr<jsi::Object>
  forward(std::string imageSource,
          std::set<std::string, std::less<>> classesOfInterest, bool resize);

private:
  std::pair<TensorPtr, cv::Size> preprocess(const std::string &imageSource);
  std::unique_ptr<jsi::Object>
  postprocess(const Tensor &tensor, cv::Size originalSize,
              std::set<std::string, std::less<>> classesOfInterest,
              bool resize);
  std::unique_ptr<jsi::Object> populateDictionary(
      std::shared_ptr<OwningArrayBuffer> argmax,
      std::shared_ptr<std::unordered_map<std::string_view,
                                         std::shared_ptr<OwningArrayBuffer>>>
          classesToOutput);

  static constexpr std::size_t numClasses{deeplabv3_resnet50_labels.size()};
  cv::Size modelImageSize;
  std::size_t numModelPixels;
};
} // namespace rnexecutorch