#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include "rnexecutorch/models/VisionModel.h"
#include "rnexecutorch/models/pose_estimation/Types.h"
#include <executorch/runtime/core/evalue.h>
#include <optional>

namespace rnexecutorch {
namespace models::pose_estimation {

class PoseEstimation : public VisionModel {
public:
  PoseEstimation(const std::string &modelSource, std::vector<float> normMean,
                 std::vector<float> normStd,
                 std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] PoseDetections
  generateFromString(std::string imageSource, double detectionThreshold,
                     double iouThreshold, std::string methodName);
  [[nodiscard("Registered non-void function")]] PoseDetections
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData,
                    double detectionThreshold, double iouThreshold,
                    std::vector<int32_t> classIndices, std::string methodName);
  [[nodiscard("Registered non-void function")]] PoseDetections
  generateFromPixels(JSTensorViewIn pixelData, double detectionThreshold,
                     double iouThreshold, std::vector<int32_t> classIndices,
                     std::string methodName);

private:
  std::optional<cv::Scalar> normMean_;
  std::optional<cv::Scalar> normStd_;

  [[nodiscard("Registered non-void function")]]
  PoseDetections runInference(cv::Mat image, double detectionThreshold,
                              double iouThreshold,
                              const std::string &modelName);

  [[nodiscard("Registered non-void function")]]
  PoseDetections postprocess(const std::vector<EValue> &evl,
                             cv::Size originalSize, double detectionThreshold);
};

} // namespace models::pose_estimation

REGISTER_CONSTRUCTOR(models::pose_estimation::PoseEstimation, std::string,
                     std::vector<float>, std::vector<float>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
