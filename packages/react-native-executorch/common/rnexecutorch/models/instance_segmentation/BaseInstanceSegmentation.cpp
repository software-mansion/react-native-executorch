#include "BaseInstanceSegmentation.h"

#include <cmath>
#include <cstdint>
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
    : BaseModel(modelSource, callInvoker), applyNMS_(applyNMS) {

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

cv::Mat BaseInstanceSegmentation::processMaskFromLogits(
    const cv::Mat &logitsMat, float x1, float y1, float x2, float y2,
    cv::Size modelInputSize, cv::Size originalSize, int32_t maskW,
    int32_t maskH, int32_t bboxW, int32_t bboxH, float origX1, float origY1,
    bool warpToOriginal, int32_t &outWidth, int32_t &outHeight) {

  float mx1F = x1 * maskW / modelInputSize.width;
  float my1F = y1 * maskH / modelInputSize.height;
  float mx2F = x2 * maskW / modelInputSize.width;
  float my2F = y2 * maskH / modelInputSize.height;

  int32_t mx1 = std::max(0, static_cast<int32_t>(std::floor(mx1F)));
  int32_t my1 = std::max(0, static_cast<int32_t>(std::floor(my1F)));
  int32_t mx2 = std::min(maskW, static_cast<int32_t>(std::ceil(mx2F)));
  int32_t my2 = std::min(maskH, static_cast<int32_t>(std::ceil(my2F)));

  cv::Mat finalBinaryMat;
  outWidth = bboxW;
  outHeight = bboxH;

  if (warpToOriginal) {
    int32_t pmx1 = std::max(0, mx1 - 1);
    int32_t pmy1 = std::max(0, my1 - 1);
    int32_t pmx2 = std::min(maskW, mx2 + 1);
    int32_t pmy2 = std::min(maskH, my2 + 1);

    cv::Mat croppedLogits =
        logitsMat(cv::Rect(pmx1, pmy1, pmx2 - pmx1, pmy2 - pmy1));
    cv::Mat probMat;
    cv::exp(-croppedLogits, probMat);
    probMat = 255.0f / (1.0f + probMat);
    probMat.convertTo(probMat, CV_8UC1);

    float maskToOrigX = static_cast<float>(originalSize.width) / maskW;
    float maskToOrigY = static_cast<float>(originalSize.height) / maskH;

    cv::Mat M =
        (cv::Mat_<float>(2, 3) << maskToOrigX, 0, (pmx1 * maskToOrigX - origX1),
         0, maskToOrigY, (pmy1 * maskToOrigY - origY1));

    cv::Mat warpedMat;
    cv::warpAffine(probMat, warpedMat, M, cv::Size(bboxW, bboxH),
                   cv::INTER_LINEAR);

    cv::threshold(warpedMat, finalBinaryMat, 127, 1, cv::THRESH_BINARY);
  } else {
    cv::Mat croppedLogits = logitsMat(cv::Rect(mx1, my1, mx2 - mx1, my2 - my1));
    cv::Mat probMat;
    cv::exp(-croppedLogits, probMat);
    probMat = 255.0f / (1.0f + probMat);
    probMat.convertTo(probMat, CV_8UC1);

    cv::threshold(probMat, finalBinaryMat, 127, 1, cv::THRESH_BINARY);
    outWidth = finalBinaryMat.cols;
    outHeight = finalBinaryMat.rows;
  }

  return finalBinaryMat;
}

std::optional<types::InstanceMask> BaseInstanceSegmentation::processDetection(
    int32_t detectionIndex, const float *bboxData, const float *scoresData,
    const float *maskData, int32_t maskH, int32_t maskW,
    cv::Size modelInputSize, cv::Size originalSize, float widthRatio,
    float heightRatio, double confidenceThreshold,
    const std::set<int32_t> &allowedClasses,
    bool returnMaskAtOriginalResolution) {

  int32_t i = detectionIndex;

  float x1 = bboxData[i * 4 + 0];
  float y1 = bboxData[i * 4 + 1];
  float x2 = bboxData[i * 4 + 2];
  float y2 = bboxData[i * 4 + 3];
  float score = scoresData[i * 2 + 0];
  auto labelIdx = static_cast<std::size_t>(scoresData[i * 2 + 1]);

  if (score < confidenceThreshold) {
    return std::nullopt;
  }
  if (!allowedClasses.empty() && allowedClasses.find(static_cast<int32_t>(
                                     labelIdx)) == allowedClasses.end()) {
    return std::nullopt;
  }

  // Scale bbox to original image coordinates
  float origX1 = x1 * widthRatio;
  float origY1 = y1 * heightRatio;
  float origX2 = x2 * widthRatio;
  float origY2 = y2 * heightRatio;

  int32_t bboxW = static_cast<int32_t>(std::round(origX2 - origX1));
  int32_t bboxH = static_cast<int32_t>(std::round(origY2 - origY1));

  if (bboxW <= 0 || bboxH <= 0) {
    return std::nullopt;
  }

  const float *logits = maskData + (i * maskH * maskW);
  cv::Mat logitsMat(maskH, maskW, CV_32FC1, const_cast<float *>(logits));

  int32_t finalMaskWidth, finalMaskHeight;
  cv::Mat finalBinaryMat = processMaskFromLogits(
      logitsMat, x1, y1, x2, y2, modelInputSize, originalSize, maskW, maskH,
      bboxW, bboxH, origX1, origY1, returnMaskAtOriginalResolution,
      finalMaskWidth, finalMaskHeight);

  std::vector<uint8_t> finalMask(finalBinaryMat.data,
                                 finalBinaryMat.data + finalBinaryMat.total());

  return types::InstanceMask(
      utils::computer_vision::BBox{origX1, origY1, origX2, origY2},
      std::move(finalMask), finalMaskWidth, finalMaskHeight,
      static_cast<int32_t>(labelIdx), score, i);
}

std::vector<types::InstanceMask> BaseInstanceSegmentation::postprocess(
    const std::vector<EValue> &tensors, cv::Size originalSize,
    cv::Size modelInputSize, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, const std::vector<int32_t> &classIndices,
    bool returnMaskAtOriginalResolution) {

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

  float widthRatio =
      static_cast<float>(originalSize.width) / modelInputSize.width;
  float heightRatio =
      static_cast<float>(originalSize.height) / modelInputSize.height;

  std::set<int32_t> allowedClasses;
  if (!classIndices.empty()) {
    allowedClasses.insert(classIndices.begin(), classIndices.end());
  }

  std::vector<types::InstanceMask> instances;

  size_t numTensors = tensors.size();
  if (numTensors != 3) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Expected 3 output tensors ([1,N,4] + [1,N,2] + "
                            "[1,N,H,W]), got " +
                                std::to_string(numTensors));
  }

  // CONTRACT: [1,N,4] + [1,N,2] + [1,N,H,W]
  //   bbox:        [x1, y1, x2, y2] in model input coordinates
  //   scores:      [max_score, class_id] — post-sigmoid
  //   mask_logits: pre-sigmoid, per-detection
  auto bboxTensor = tensors[0].toTensor();   // [1, N, 4]
  auto scoresTensor = tensors[1].toTensor(); // [1, N, 2]
  auto maskTensor = tensors[2].toTensor();   // [1, N, H, W]

  int32_t N = bboxTensor.size(1);
  int32_t maskH = maskTensor.size(2);
  int32_t maskW = maskTensor.size(3);
  const float *bboxData = bboxTensor.const_data_ptr<float>();
  const float *scoresData = scoresTensor.const_data_ptr<float>();
  const float *maskData = maskTensor.const_data_ptr<float>();

  int32_t processed = 0;

  for (int32_t i = 0; i < N; ++i) {
    auto instance = processDetection(
        i, bboxData, scoresData, maskData, maskH, maskW, modelInputSize,
        originalSize, widthRatio, heightRatio, confidenceThreshold,
        allowedClasses, returnMaskAtOriginalResolution);

    if (instance.has_value()) {
      instances.push_back(std::move(*instance));
      ++processed;
    }
  }

  // Finalize: NMS + limit + renumber
  if (applyNMS_) {
    instances =
        utils::computer_vision::nonMaxSuppression(instances, iouThreshold);
  }

  if (std::cmp_greater(instances.size(), maxInstances)) {
    instances.resize(maxInstances);
  }

  for (size_t i = 0; i < instances.size(); ++i) {
    instances[i].instanceId = static_cast<int32_t>(i);
  }

  return instances;
}

std::vector<types::InstanceMask> BaseInstanceSegmentation::generate(
    std::string imageSource, double confidenceThreshold, double iouThreshold,
    int32_t maxInstances, std::vector<int32_t> classIndices,
    bool returnMaskAtOriginalResolution, std::string methodName) {

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
    module_->load_method(methodName);
  }

  auto inputShapes = getAllInputShapes(methodName);
  std::vector<int32_t> inputShape = inputShapes[0];
  int32_t inputSize = inputShape[inputShape.size() - 1];
  cv::Size modelInputSize(inputSize, inputSize);

  auto [inputTensor, originalSize] = image_processing::readImageToTensor(
      imageSource, inputShape, false, normMean_, normStd_);

  auto forwardResult = BaseModel::execute(methodName, {inputTensor});
  if (!forwardResult.ok()) {
    throw RnExecutorchError(
        forwardResult.error(),
        "The model's forward function did not succeed. "
        "Ensure the model input is correct and method name '" +
            methodName + "' is valid.");
  }

  auto result = postprocess(forwardResult.get(), originalSize, modelInputSize,
                            confidenceThreshold, iouThreshold, maxInstances,
                            classIndices, returnMaskAtOriginalResolution);

  return result;
}

} // namespace rnexecutorch::models::instance_segmentation
