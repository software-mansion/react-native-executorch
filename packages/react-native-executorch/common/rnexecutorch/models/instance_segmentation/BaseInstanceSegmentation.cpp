#include "BaseInstanceSegmentation.h"

#include <cmath>
#include <cstdint>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/utils/FrameProcessor.h>
#include <rnexecutorch/utils/FrameTransform.h>
#include <rnexecutorch/utils/computer_vision/Processing.h>
#include <set>

namespace rnexecutorch::models::instance_segmentation {

BaseInstanceSegmentation::BaseInstanceSegmentation(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, bool applyNMS,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker), applyNMS_(applyNMS) {
  initNormalization(normMean, normStd);
}

cv::Size BaseInstanceSegmentation::modelInputSize() const {
  if (!currentlyLoadedMethod_.empty()) {
    return getModelInputSize(currentlyLoadedMethod_);
  }
  return VisionModel::modelInputSize();
}

TensorPtr BaseInstanceSegmentation::buildInputTensor(const cv::Mat &image) {
  cv::Mat preprocessed = preprocess(image);
  return createInputTensor(preprocessed);
}

std::vector<types::Instance> BaseInstanceSegmentation::runInference(
    const cv::Mat &image, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, const std::vector<int32_t> &classIndices,
    bool returnMaskAtOriginalResolution, const std::string &methodName) {

  std::scoped_lock lock(inference_mutex_);

  ensureMethodLoaded(methodName);

  modelInputShape_ = validateAndGetInputShape(methodName, 2);
  const auto &shape = modelInputShape_;
  cv::Size modelInputSize(shape[shape.size() - 2], shape[shape.size() - 1]);
  cv::Size originalSize(image.cols, image.rows);

  utils::computer_vision::validateThreshold(confidenceThreshold,
                                            "confidenceThreshold");
  utils::computer_vision::validateThreshold(iouThreshold, "iouThreshold");

  auto outputs =
      executeOrThrow(methodName, {buildInputTensor(image)},
                     "The model's forward function did not succeed. "
                     "Ensure the model input is correct and method name '" +
                         methodName + "' is valid.");

  validateOutputTensors(outputs);

  auto instances = collectInstances(outputs, originalSize, modelInputSize,
                                    confidenceThreshold, classIndices,
                                    returnMaskAtOriginalResolution);
  return finalizeInstances(std::move(instances), iouThreshold, maxInstances);
}

std::vector<types::Instance> BaseInstanceSegmentation::generateFromString(
    std::string imageSource, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, std::vector<int32_t> classIndices,
    bool returnMaskAtOriginalResolution, std::string methodName) {

  cv::Mat imageRGB = loadImageToRGB(imageSource);
  return runInference(imageRGB, confidenceThreshold, iouThreshold, maxInstances,
                      classIndices, returnMaskAtOriginalResolution, methodName);
}

std::vector<types::Instance> BaseInstanceSegmentation::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &frameData,
    double confidenceThreshold, double iouThreshold, int32_t maxInstances,
    std::vector<int32_t> classIndices, bool returnMaskAtOriginalResolution,
    std::string methodName) {

  auto [rotated, orient, _] = loadFrameRotated(runtime, frameData);
  auto instances =
      runInference(rotated, confidenceThreshold, iouThreshold, maxInstances,
                   classIndices, returnMaskAtOriginalResolution, methodName);

  // Inverse-rotate bboxes for all instances
  utils::inverseRotateBboxes(instances, orient, rotated.size());

  // Inverse-rotate masks (instance-specific logic)
  for (auto &inst : instances) {
    cv::Mat maskMat(inst.maskHeight, inst.maskWidth, CV_8UC1,
                    inst.mask->data());
    cv::Mat invMask = utils::inverseRotateMat(maskMat, orient);
    inst.mask = std::make_shared<OwningArrayBuffer>(
        invMask.data, static_cast<size_t>(invMask.total()));
    inst.maskWidth = invMask.cols;
    inst.maskHeight = invMask.rows;
  }
  return instances;
}

std::vector<types::Instance> BaseInstanceSegmentation::generateFromPixels(
    JSTensorViewIn tensorView, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, std::vector<int32_t> classIndices,
    bool returnMaskAtOriginalResolution, std::string methodName) {

  cv::Mat image = extractFromPixels(tensorView);
  return runInference(image, confidenceThreshold, iouThreshold, maxInstances,
                      classIndices, returnMaskAtOriginalResolution, methodName);
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

  return {mx1, my1, mx2 - mx1, my2 - my1};
}

cv::Rect BaseInstanceSegmentation::addPaddingToRect(const cv::Rect &rect,
                                                    cv::Size maskSize) {
  int32_t x1 = std::max(0, rect.x - 1);
  int32_t y1 = std::max(0, rect.y - 1);
  int32_t x2 = std::min(maskSize.width, rect.x + rect.width + 1);
  int32_t y2 = std::min(maskSize.height, rect.y + rect.height + 1);

  return {x1, y1, x2 - x1, y2 - y1};
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

void BaseInstanceSegmentation::validateOutputTensors(
    const std::vector<EValue> &tensors) const {
  if (tensors.size() != 3) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidModelOutput,
                            "Expected 3 output tensors ([1,N,4] + [1,N,2] + "
                            "[1,N,H,W]), got " +
                                std::to_string(tensors.size()));
  }
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

std::vector<types::Instance> BaseInstanceSegmentation::collectInstances(
    const std::vector<EValue> &tensors, cv::Size originalSize,
    cv::Size modelInputSize, double confidenceThreshold,
    const std::vector<int32_t> &classIndices,
    bool returnMaskAtOriginalResolution) {

  float widthRatio =
      static_cast<float>(originalSize.width) / modelInputSize.width;
  float heightRatio =
      static_cast<float>(originalSize.height) / modelInputSize.height;
  std::set<int32_t> allowedClasses(classIndices.begin(), classIndices.end());

  // CONTRACT
  auto bboxTensor = tensors[0].toTensor();   // [1, N, 4]
  auto scoresTensor = tensors[1].toTensor(); // [1, N, 2]
  auto maskTensor = tensors[2].toTensor();   // [1, N, H, W]

  int32_t numInstances = bboxTensor.size(1);
  int32_t maskH = maskTensor.size(2);
  int32_t maskW = maskTensor.size(3);

  const float *bboxData = bboxTensor.const_data_ptr<float>();
  const float *scoresData = scoresTensor.const_data_ptr<float>();
  const float *maskData = maskTensor.const_data_ptr<float>();

  auto isValidDetection =
      [&allowedClasses, &confidenceThreshold](float score, int32_t labelIdx) {
        return score >= confidenceThreshold &&
               (allowedClasses.empty() || allowedClasses.count(labelIdx) != 0);
      };

  std::vector<types::Instance> instances;

  for (int32_t i = 0; i < numInstances; ++i) {
    auto [bboxModel, score, labelIdx] =
        utils::computer_vision::extractDetectionData(bboxData, scoresData, i);

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

    instances.emplace_back(bboxOriginal,
                           std::make_shared<OwningArrayBuffer>(
                               binaryMask.data, binaryMask.total()),
                           binaryMask.cols, binaryMask.rows, labelIdx, score);
  }

  return instances;
}

} // namespace rnexecutorch::models::instance_segmentation
