#include "BaseInstanceSegmentation.h"

#include <cmath>
#include <cstdint>
#include <iostream>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/utils/computer_vision/Processing.h>

namespace rnexecutorch::models::instance_segmentation {

BaseInstanceSegmentation::BaseInstanceSegmentation(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, bool applyNMS,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker), applyNMS_(applyNMS) {

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

cv::Size BaseInstanceSegmentation::modelInputSize() const {
  if (currentlyLoadedMethod_.empty()) {
    return VisionModel::modelInputSize();
  }
  auto inputShapes = getAllInputShapes(currentlyLoadedMethod_);
  if (inputShapes.empty() || inputShapes[0].size() < 2) {
    return VisionModel::modelInputSize();
  }
  const auto &shape = inputShapes[0];
  return cv::Size(shape[shape.size() - 1], shape[shape.size() - 2]);
}

std::vector<types::Instance> BaseInstanceSegmentation::runInference(
    const cv::Mat &image, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, const std::vector<int32_t> &classIndices,
    bool returnMaskAtOriginalResolution, const std::string &methodName) {

  std::scoped_lock lock(inference_mutex_);

  ensureMethodLoaded(methodName);

  auto inputShapes = getAllInputShapes(methodName);
  if (inputShapes.empty() || inputShapes[0].empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Method '" + methodName +
                                "' has invalid input tensor shape.");
  }

  modelInputShape_ = inputShapes[0];
  const auto &shape = modelInputShape_;
  cv::Size modelInputSize(shape[shape.size() - 1], shape[shape.size() - 2]);
  cv::Size originalSize(image.cols, image.rows);

  cv::Mat preprocessed = preprocess(image);

  auto inputTensor = (normMean_.has_value() && normStd_.has_value())
                         ? image_processing::getTensorFromMatrix(
                               modelInputShape_, preprocessed,
                               normMean_.value(), normStd_.value())
                         : image_processing::getTensorFromMatrix(
                               modelInputShape_, preprocessed);

  auto forwardResult = BaseModel::execute(methodName, {inputTensor});
  if (!forwardResult.ok()) {
    throw RnExecutorchError(
        forwardResult.error(),
        "The model's forward function did not succeed. "
        "Ensure the model input is correct and method name '" +
            methodName + "' is valid.");
  }

  return postprocess(forwardResult.get(), originalSize, modelInputSize,
                     confidenceThreshold, iouThreshold, maxInstances,
                     classIndices, returnMaskAtOriginalResolution);
}

std::vector<types::Instance> BaseInstanceSegmentation::generateFromString(
    std::string imageSource, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, std::vector<int32_t> classIndices,
    bool returnMaskAtOriginalResolution, std::string methodName) {

  cv::Mat imageBGR = image_processing::readImage(imageSource);
  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);

  return runInference(imageRGB, confidenceThreshold, iouThreshold, maxInstances,
                      classIndices, returnMaskAtOriginalResolution, methodName);
}

std::vector<types::Instance> BaseInstanceSegmentation::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &frameData,
    double confidenceThreshold, double iouThreshold, int32_t maxInstances,
    std::vector<int32_t> classIndices, bool returnMaskAtOriginalResolution,
    std::string methodName) {

  cv::Mat frame = extractFromFrame(runtime, frameData);
  return runInference(frame, confidenceThreshold, iouThreshold, maxInstances,
                      classIndices, returnMaskAtOriginalResolution, methodName);
}

std::vector<types::Instance> BaseInstanceSegmentation::generateFromPixels(
    JSTensorViewIn tensorView, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, std::vector<int32_t> classIndices,
    bool returnMaskAtOriginalResolution, std::string methodName) {

  cv::Mat image = extractFromPixels(tensorView);
  return runInference(image, confidenceThreshold, iouThreshold, maxInstances,
                      classIndices, returnMaskAtOriginalResolution, methodName);
}

std::tuple<utils::computer_vision::BBox, float, int32_t>
BaseInstanceSegmentation::extractDetectionData(const float *bboxData,
                                               const float *scoresData,
                                               int32_t index) {
  utils::computer_vision::BBox bbox{
      bboxData[index * 4], bboxData[index * 4 + 1], bboxData[index * 4 + 2],
      bboxData[index * 4 + 3]};
  float score = scoresData[index * 2];
  int32_t label = static_cast<int32_t>(scoresData[index * 2 + 1]);

  return {bbox, score, label};
}

cv::Rect BaseInstanceSegmentation::computeMaskCropRect(
    const utils::computer_vision::BBox &bboxModel, cv::Size modelInputSize,
    cv::Size maskSize) {

  float mx1F = bboxModel.x1 * maskSize.width / modelInputSize.width;
  float my1F = bboxModel.y1 * maskSize.height / modelInputSize.height;
  float mx2F = bboxModel.x2 * maskSize.width / modelInputSize.width;
  float my2F = bboxModel.y2 * maskSize.height / modelInputSize.height;

  int32_t mx1 = std::max(0, static_cast<int32_t>(std::floor(mx1F)));
  int32_t my1 = std::max(0, static_cast<int32_t>(std::floor(my1F)));
  int32_t mx2 = std::min(maskSize.width, static_cast<int32_t>(std::ceil(mx2F)));
  int32_t my2 =
      std::min(maskSize.height, static_cast<int32_t>(std::ceil(my2F)));

  return cv::Rect(mx1, my1, mx2 - mx1, my2 - my1);
}

cv::Rect BaseInstanceSegmentation::addPaddingToRect(const cv::Rect &rect,
                                                    cv::Size maskSize) {
  int32_t x1 = std::max(0, rect.x - 1);
  int32_t y1 = std::max(0, rect.y - 1);
  int32_t x2 = std::min(maskSize.width, rect.x + rect.width + 1);
  int32_t y2 = std::min(maskSize.height, rect.y + rect.height + 1);

  return cv::Rect(x1, y1, x2 - x1, y2 - y1);
}

cv::Mat BaseInstanceSegmentation::warpToOriginalResolution(
    const cv::Mat &probMat, const cv::Rect &maskRect, cv::Size originalSize,
    cv::Size maskSize, const utils::computer_vision::BBox &bboxOriginal) {

  float scaleX = static_cast<float>(originalSize.width) / maskSize.width;
  float scaleY = static_cast<float>(originalSize.height) / maskSize.height;

  cv::Mat M = (cv::Mat_<float>(2, 3) << scaleX, 0,
               (maskRect.x * scaleX - bboxOriginal.x1), 0, scaleY,
               (maskRect.y * scaleY - bboxOriginal.y1));

  cv::Size bboxSize(static_cast<int32_t>(std::round(bboxOriginal.width())),
                    static_cast<int32_t>(std::round(bboxOriginal.height())));

  cv::Mat warped;
  cv::warpAffine(probMat, warped, M, bboxSize, cv::INTER_LINEAR);
  return warped;
}

cv::Mat BaseInstanceSegmentation::thresholdToBinary(const cv::Mat &probMat) {
  cv::Mat binary;
  cv::threshold(probMat, binary, 127, 1, cv::THRESH_BINARY);
  return binary;
}

cv::Mat BaseInstanceSegmentation::processMaskFromLogits(
    const cv::Mat &logitsMat, const utils::computer_vision::BBox &bboxModel,
    const utils::computer_vision::BBox &bboxOriginal, cv::Size modelInputSize,
    cv::Size originalSize, bool warpToOriginal) {

  cv::Size maskSize = logitsMat.size();
  cv::Rect cropRect = computeMaskCropRect(bboxModel, modelInputSize, maskSize);

  if (warpToOriginal) {
    cropRect = addPaddingToRect(cropRect, maskSize);
  }

  cv::Mat cropped = logitsMat(cropRect);
  cv::Mat probMat = image_processing::applySigmoid(cropped);

  if (warpToOriginal) {
    probMat = warpToOriginalResolution(probMat, cropRect, originalSize,
                                       maskSize, bboxOriginal);
  }
  return thresholdToBinary(probMat);
}

void BaseInstanceSegmentation::validateThresholds(double confidenceThreshold,
                                                  double iouThreshold) const {
  if (confidenceThreshold < 0 || confidenceThreshold > 1) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidConfig,
        "Confidence threshold must be greater or equal to 0 "
        "and less than or equal to 1.");
  }

  if (iouThreshold < 0 || iouThreshold > 1) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "IoU threshold must be greater or equal to 0 "
                            "and less than or equal to 1.");
  }
}

void BaseInstanceSegmentation::validateOutputTensors(
    const std::vector<EValue> &tensors) const {
  if (tensors.size() != 3) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Expected 3 output tensors ([1,N,4] + [1,N,2] + "
                            "[1,N,H,W]), got " +
                                std::to_string(tensors.size()));
  }
}

std::set<int32_t> BaseInstanceSegmentation::prepareAllowedClasses(
    const std::vector<int32_t> &classIndices) const {
  std::set<int32_t> allowedClasses;
  if (!classIndices.empty()) {
    allowedClasses.insert(classIndices.begin(), classIndices.end());
  }
  return allowedClasses;
}

void BaseInstanceSegmentation::ensureMethodLoaded(
    const std::string &methodName) {
  if (methodName.empty()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidConfig,
        "methodName cannot be empty. Use 'forward' for single-method models "
        "or 'forward_{inputSize}' for multi-method models.");
  }

  if (currentlyLoadedMethod_ != methodName) {
    if (!currentlyLoadedMethod_.empty()) {
      module_->unload_method(currentlyLoadedMethod_);
    }
    currentlyLoadedMethod_ = methodName;
    auto loadResult = module_->load_method(methodName);
    if (loadResult != executorch::runtime::Error::Ok) {
      throw RnExecutorchError(
          loadResult, "Failed to load method '" + methodName +
                          "'. Ensure the method exists in the exported model.");
    }
  }
}

cv::Size BaseInstanceSegmentation::getInputSize(const std::string &methodName) {
  auto inputShapes = getAllInputShapes(methodName);
  if (inputShapes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Method '" + methodName +
                                "' has no input tensors.");
  }

  const auto &inputShape = inputShapes[0];
  if (inputShape.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Method '" + methodName +
                                "' input tensor has no dimensions.");
  }

  int32_t inputSize = inputShape[inputShape.size() - 1];
  return cv::Size(inputSize, inputSize);
}

std::vector<types::Instance> BaseInstanceSegmentation::finalizeInstances(
    std::vector<types::Instance> instances, double iouThreshold,
    int32_t maxInstances) const {

  if (applyNMS_) {
    instances =
        utils::computer_vision::nonMaxSuppression(instances, iouThreshold);
  }

  if (std::cmp_greater(instances.size(), maxInstances)) {
    instances.resize(maxInstances);
  }

  return instances;
}

std::vector<types::Instance> BaseInstanceSegmentation::postprocess(
    const std::vector<EValue> &tensors, cv::Size originalSize,
    cv::Size modelInputSize, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, const std::vector<int32_t> &classIndices,
    bool returnMaskAtOriginalResolution) {

  validateThresholds(confidenceThreshold, iouThreshold);
  validateOutputTensors(tensors);

  float widthRatio =
      static_cast<float>(originalSize.width) / modelInputSize.width;
  float heightRatio =
      static_cast<float>(originalSize.height) / modelInputSize.height;
  std::set<int32_t> allowedClasses = prepareAllowedClasses(classIndices);

  // CONTRACT
  auto bboxTensor = tensors[0].toTensor();   // [1, N, 4]
  auto scoresTensor = tensors[1].toTensor(); // [1, N, 2]
  auto maskTensor = tensors[2].toTensor();   // [1, N, H, W]

  int32_t N = bboxTensor.size(1);
  int32_t maskH = maskTensor.size(2);
  int32_t maskW = maskTensor.size(3);

  const float *bboxData = bboxTensor.const_data_ptr<float>();
  const float *scoresData = scoresTensor.const_data_ptr<float>();
  const float *maskData = maskTensor.const_data_ptr<float>();

  auto isValidDetection =
      [&allowedClasses, &confidenceThreshold](float score, int32_t labelIdx) {
        if (score < confidenceThreshold) {
          return false;
        }
        if (!allowedClasses.empty() && allowedClasses.count(labelIdx) == 0) {
          return false;
        }
        return true;
      };

  std::vector<types::Instance> instances;

  for (int32_t i = 0; i < N; ++i) {
    auto [bboxModel, score, labelIdx] =
        extractDetectionData(bboxData, scoresData, i);

    if (!isValidDetection(score, labelIdx)) {
      continue;
    }

    utils::computer_vision::BBox bboxOriginal =
        bboxModel.scale(widthRatio, heightRatio);
    if (!bboxOriginal.isValid()) {
      continue;
    }

    cv::Mat logitsMat(maskH, maskW, CV_32FC1,
                      const_cast<float *>(maskData + (i * maskH * maskW)));

    cv::Mat binaryMask = processMaskFromLogits(
        logitsMat, bboxModel, bboxOriginal, modelInputSize, originalSize,
        returnMaskAtOriginalResolution);

    instances.emplace_back(
        bboxOriginal,
        std::vector<uint8_t>(binaryMask.data,
                             binaryMask.data + binaryMask.total()),
        binaryMask.cols, binaryMask.rows, labelIdx, score);
  }

  return finalizeInstances(std::move(instances), iouThreshold, maxInstances);
}

} // namespace rnexecutorch::models::instance_segmentation
