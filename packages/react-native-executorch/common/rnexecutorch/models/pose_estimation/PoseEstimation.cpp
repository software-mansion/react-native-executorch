#include "PoseEstimation.h"
#include "ReactCommon/CallInvoker.h"
#include <cmath>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/utils/FrameProcessor.h>
#include <rnexecutorch/utils/FrameTransform.h>

namespace rnexecutorch::models::pose_estimation {

PoseEstimation::PoseEstimation(const std::string &modelSource,
                               std::vector<float> normMean,
                               std::vector<float> normStd,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  if (normMean.size() == 3) {
    normMean_ = cv::Scalar(normMean[0], normMean[1], normMean[2]);
  } else if (!normMean.empty()) {
    log(LOG_LEVEL::Warn,
        "normMean must have 3 elements — ignoring provided value.");
  }
  if (normStd.size() == 3) {
    normStd_ = cv::Scalar(normStd[0], normStd[1], normStd[2]);
  } else if (!normStd.empty()) {
    log(LOG_LEVEL::Warn,
        "normStd must have 3 elements — ignoring provided value.");
  }
}

PoseDetections PoseEstimation::postprocess(const std::vector<EValue> &tensors,
                                           cv::Size originalSize,
                                           double detectionThreshold) {
  // Output tensors (batch dim squeezed):
  //   0: boxes     (Q, 4)    - xyxy bbox in model input pixel space
  //   1: scores    (Q,)      - person confidence [0, 1]
  //   2: keypoints (Q, K, 3) - per-detection keypoints (x, y, visibility)

  if (tensors.size() < 3) {
    // TODO: maybe create a ContractNotMet error or something like this, this
    // would also need to be applied for other models
    return {};
  }

  auto scoresTensor = tensors[1].toTensor();
  auto keypointsTensor = tensors[2].toTensor();

  const int32_t numKeypoints = static_cast<int32_t>(keypointsTensor.size(1));

  const float *scores = scoresTensor.const_data_ptr<float>();
  const float *kpData = keypointsTensor.const_data_ptr<float>();

  int32_t numDetections = static_cast<int32_t>(scoresTensor.size(0));

  const auto &shape = modelInputShape_;
  cv::Size modelInputSize(static_cast<int32_t>(shape[shape.size() - 1]),
                          static_cast<int32_t>(shape[shape.size() - 2]));

  float scaleX = static_cast<float>(originalSize.width) / modelInputSize.width;
  float scaleY =
      static_cast<float>(originalSize.height) / modelInputSize.height;

  PoseDetections allDetections;

  for (size_t i = 0; i < numDetections; ++i) {
    if (scores[i] < detectionThreshold) {
      continue;
    }

    PersonKeypoints keypoints;
    keypoints.reserve(numKeypoints);

    const float *detectionKps = kpData + i * numKeypoints * 3;

    for (size_t k = 0; k < numKeypoints; ++k) {
      float x = detectionKps[k * 3];
      float y = detectionKps[k * 3 + 1];

      int32_t scaledX = static_cast<int32_t>(std::round(x * scaleX));
      int32_t scaledY = static_cast<int32_t>(std::round(y * scaleY));

      keypoints.emplace_back(scaledX, scaledY);
    }

    allDetections.push_back(std::move(keypoints));
  }

  return allDetections;
}

PoseDetections PoseEstimation::runInference(cv::Mat image,
                                            double detectionThreshold,
                                            double iouThreshold,
                                            const std::string &methodName) {

  log(LOG_LEVEL::Debug, "Running inference with model name: " + methodName);

  if (detectionThreshold < 0.0 || detectionThreshold > 1.0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "detectionThreshold must be in range [0, 1]");
  }
  if (iouThreshold < 0.0 || iouThreshold > 1.0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "iouThreshold must be in range [0, 1]");
  }

  std::scoped_lock lock(inference_mutex_);
  cv::Size originalSize = image.size();
  auto inputShapes = getAllInputShapes(methodName);
  if (inputShapes.empty() || inputShapes[0].size() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Could not determine input shape for method: " +
                                methodName);
  }
  modelInputShape_ = inputShapes[0];
  cv::Mat resizedToModelInput = preprocess(image);

  auto inputTensor =
      (normMean_ && normStd_)
          ? image_processing::getTensorFromMatrix(
                modelInputShape_, resizedToModelInput, *normMean_, *normStd_)
          : image_processing::getTensorFromMatrix(modelInputShape_,
                                                  resizedToModelInput);

  auto executeResult = execute(methodName, {inputTensor});
  if (!executeResult.ok()) {
    throw RnExecutorchError(executeResult.error(),
                            "The model's " + methodName +
                                " method did not succeed. "
                                "Ensure the model input is correct.");
  }

  return postprocess(executeResult.get(), originalSize, detectionThreshold);
}

PoseDetections PoseEstimation::generateFromString(std::string imageSource,
                                                  double detectionThreshold,
                                                  double iouThreshold,
                                                  std::string methodName) {
  cv::Mat imageBGR = image_processing::readImage(imageSource);
  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);
  return runInference(std::move(imageRGB), detectionThreshold, iouThreshold,
                      methodName);
}

PoseDetections PoseEstimation::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &frameData,
    double detectionThreshold, double iouThreshold,
    std::vector<int32_t> classIndices, std::string methodName) {
  (void)classIndices; // Not used for pose estimation
  auto orient = ::rnexecutorch::utils::readFrameOrientation(runtime, frameData);
  cv::Mat frame = extractFromFrame(runtime, frameData);
  cv::Mat rotated = ::rnexecutorch::utils::rotateFrameForModel(frame, orient);
  return runInference(rotated, detectionThreshold, iouThreshold, methodName);
}

PoseDetections PoseEstimation::generateFromPixels(
    JSTensorViewIn pixelData, double detectionThreshold, double iouThreshold,
    std::vector<int32_t> classIndices, std::string methodName) {
  (void)classIndices; // Not used for pose estimation
  cv::Mat image = extractFromPixels(pixelData);
  return runInference(image, detectionThreshold, iouThreshold, methodName);
}

} // namespace rnexecutorch::models::pose_estimation
