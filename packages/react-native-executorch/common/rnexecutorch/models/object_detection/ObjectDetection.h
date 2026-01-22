#pragma once

#include <unordered_map>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/models/object_detection/Utils.h>

namespace rnexecutorch {
namespace models::object_detection {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class ObjectDetection : public VisionModel {
public:
  ObjectDetection(const std::string &modelSource,
                  std::shared_ptr<react::CallInvoker> callInvoker);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generate(std::string imageSource, double detectionThreshold);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &pixelData,
                    double detectionThreshold);

protected:
  cv::Mat preprocessFrame(const cv::Mat &frame) const override;

private:
  std::vector<types::Detection> postprocess(const std::vector<EValue> &tensors,
                                            cv::Size originalSize,
                                            double detectionThreshold);

  cv::Size modelImageSize{0, 0};
};
} // namespace models::object_detection

REGISTER_CONSTRUCTOR(models::object_detection::ObjectDetection, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch