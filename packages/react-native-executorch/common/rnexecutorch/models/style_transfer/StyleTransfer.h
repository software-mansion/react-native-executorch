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

class StyleTransfer : public VisionModel {
public:
  StyleTransfer(const std::string &modelSource,
                std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] StyleTransferResult
  generateFromString(std::string imageSource, bool saveToFile);

  [[nodiscard("Registered non-void function")]] PixelDataResult
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData);

  [[nodiscard("Registered non-void function")]] StyleTransferResult
  generateFromPixels(JSTensorViewIn pixelData, bool saveToFile);

private:
  cv::Mat runInference(cv::Mat image, cv::Size outputSize);
};
} // namespace models::style_transfer

REGISTER_CONSTRUCTOR(models::style_transfer::StyleTransfer, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
