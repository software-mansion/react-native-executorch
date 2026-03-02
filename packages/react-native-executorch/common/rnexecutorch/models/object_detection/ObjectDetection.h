#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>
#include <optional>

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
  ObjectDetection(const std::string &modelSource, std::vector<float> normMean,
                  std::vector<float> normStd,
                  std::vector<std::string> labelNames,
                  std::shared_ptr<react::CallInvoker> callInvoker);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromString(std::string imageSource, double detectionThreshold);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData,
                    double detectionThreshold);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromPixels(JSTensorViewIn pixelData, double detectionThreshold);

protected:
  std::vector<types::Detection>
  runInference(cv::Mat image, double detectionThreshold);
  cv::Mat preprocessFrame(const cv::Mat &frame) const override;

private:
  std::vector<types::Detection>
  postprocess(const std::vector<EValue> &tensors, cv::Size originalSize,
              double detectionThreshold,
              const std::vector<std::string> &labelNames);

  cv::Size modelImageSize{0, 0};
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;
  std::vector<std::string> labelNames_;
};
} // namespace models::object_detection

REGISTER_CONSTRUCTOR(models::object_detection::ObjectDetection, std::string,
                     std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
