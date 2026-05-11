#include "VisionModel.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/utils/FrameProcessor.h>
#include <rnexecutorch/utils/FrameTransform.h>

namespace rnexecutorch::models {

using namespace facebook;

VisionModel::VisionModel(const std::string &modelSource,
                         std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

void VisionModel::unload() noexcept {
  std::scoped_lock lock(inference_mutex_);
  BaseModel::unload();
}

cv::Size VisionModel::modelInputSize() const {
  if (modelInputShape_.size() < 2) {
    return {0, 0};
  }
  return cv::Size(modelInputShape_[modelInputShape_.size() - 1],
                  modelInputShape_[modelInputShape_.size() - 2]);
}

cv::Size VisionModel::getModelInputSize(const std::string &methodName) const {
  std::string method = methodName.empty() ? currentlyLoadedMethod_ : methodName;
  if (method.empty()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "No method specified and no method currently loaded");
  }

  auto inputShapes = getAllInputShapes(method);
  if (inputShapes.empty() || inputShapes[0].size() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Could not determine input shape for method: " +
                                method);
  }

  const auto &shape = inputShapes[0];
  return cv::Size(shape[shape.size() - 1], shape[shape.size() - 2]);
}

cv::Mat VisionModel::extractFromFrame(jsi::Runtime &runtime,
                                      const jsi::Value &frameData) const {
  cv::Mat frame = ::rnexecutorch::utils::frameToMat(runtime, frameData);
  cv::Mat rgb;
#ifdef __APPLE__
  cv::cvtColor(frame, rgb, cv::COLOR_BGRA2RGB);
#else
  cv::cvtColor(frame, rgb, cv::COLOR_RGBA2RGB);
#endif
  return rgb;
}

cv::Mat VisionModel::preprocess(const cv::Mat &image) const {
  const cv::Size targetSize = modelInputSize();
  if (image.size() == targetSize) {
    return image;
  }
  cv::Mat resized;
  cv::resize(image, resized, targetSize);
  return resized;
}

cv::Mat VisionModel::extractFromPixels(const JSTensorViewIn &tensorView) const {
  return ::rnexecutorch::utils::pixelsToMat(tensorView);
}

void VisionModel::initNormalization(const std::vector<float> &normMean,
                                    const std::vector<float> &normStd) {
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

TensorPtr VisionModel::createInputTensor(const cv::Mat &preprocessed) const {
  return (normMean_ && normStd_)
             ? image_processing::getTensorFromMatrix(
                   modelInputShape_, preprocessed, *normMean_, *normStd_)
             : image_processing::getTensorFromMatrix(modelInputShape_,
                                                     preprocessed);
}

cv::Mat VisionModel::loadImageToRGB(const std::string &imageSource) const {
  cv::Mat imageBGR = image_processing::readImage(imageSource);
  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);
  return imageRGB;
}

std::tuple<cv::Mat, utils::FrameOrientation, cv::Size>
VisionModel::loadFrameRotated(jsi::Runtime &runtime,
                              const jsi::Value &frameData) const {
  auto orient = utils::readFrameOrientation(runtime, frameData);
  cv::Mat frame = extractFromFrame(runtime, frameData);
  cv::Size originalSize = frame.size();
  cv::Mat rotated = utils::rotateFrameForModel(frame, orient);
  return {rotated, orient, originalSize};
}

} // namespace rnexecutorch::models
