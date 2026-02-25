#pragma once

#include <string>
#include <utility>

#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/models/style_transfer/Types.h>

namespace rnexecutorch {
namespace models::style_transfer {
using namespace facebook;
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class StyleTransfer : public VisionModel {
public:
  StyleTransfer(const std::string &modelSource,
                std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] PixelDataResult
  generateFromString(std::string imageSource);

  [[nodiscard("Registered non-void function")]] PixelDataResult
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData);

  [[nodiscard("Registered non-void function")]] PixelDataResult
  generateFromPixels(JSTensorViewIn pixelData);

protected:
  cv::Mat preprocessFrame(const cv::Mat &frame) const override;

private:
  // outputSize: size to resize the styled output to before returning.
  //   Pass modelImageSize for real-time frame processing (avoids large allocs).
  //   Pass the source image size for generateFromString/generateFromPixels.
  PixelDataResult runInference(cv::Mat image, cv::Size outputSize);

  PixelDataResult postprocess(const Tensor &tensor, cv::Size outputSize);

  cv::Size modelImageSize{0, 0};
};
} // namespace models::style_transfer

REGISTER_CONSTRUCTOR(models::style_transfer::StyleTransfer, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
