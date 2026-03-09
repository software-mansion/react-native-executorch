#include "BaseInstanceSegmentation.h"

#include <cmath>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch::models::instance_segmentation {

BaseInstanceSegmentation::BaseInstanceSegmentation(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, bool applyNMS,
    std::vector<std::string> labelNames,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), applyNMS_(applyNMS),
      labelNames_(std::move(labelNames)) {
  avalivableMethods_ = *module_->method_names();
  if (normMean.size() == 3) {
    normMean_ = cv::Scalar(normMean[0], normMean[1], normMean[2]);
  }
  if (normStd.size() == 3) {
    normStd_ = cv::Scalar(normStd[0], normStd[1], normStd[2]);
  }

  modelImageSize = cv::Size(416, 416);
}

float BaseInstanceSegmentation::intersectionOverUnion(
    const types::InstanceMask &a, const types::InstanceMask &b) {
  float x1 = std::max(a.x1, b.x1);
  float y1 = std::max(a.y1, b.y1);
  float x2 = std::min(a.x2, b.x2);
  float y2 = std::min(a.y2, b.y2);

  float intersectionArea = std::max(0.0f, x2 - x1) * std::max(0.0f, y2 - y1);
  float areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  float areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  float unionArea = areaA + areaB - intersectionArea;

  return (unionArea > 0) ? (intersectionArea / unionArea) : 0.0f;
}

std::vector<types::InstanceMask> BaseInstanceSegmentation::nonMaxSuppression(
    std::vector<types::InstanceMask> instances, double iouThreshold) {
  if (instances.empty()) {
    return {};
  }

  std::sort(instances.begin(), instances.end(),
            [](const types::InstanceMask &a, const types::InstanceMask &b) {
              return a.score > b.score;
            });

  std::vector<types::InstanceMask> result;
  std::vector<bool> suppressed(instances.size(), false);

  for (size_t i = 0; i < instances.size(); ++i) {
    if (suppressed[i]) {
      continue;
    }

    result.push_back(instances[i]);

    for (size_t j = i + 1; j < instances.size(); ++j) {
      if (suppressed[j]) {
        continue;
      }

      if (instances[i].label == instances[j].label) {
        float iou = intersectionOverUnion(instances[i], instances[j]);
        if (iou > iouThreshold) {
          suppressed[j] = true;
        }
      }
    }
  }

  return result;
}

std::vector<types::InstanceMask> BaseInstanceSegmentation::postprocess(
    const std::vector<EValue> &tensors, cv::Size originalSize,
    cv::Size modelInputSize, double confidenceThreshold, double iouThreshold,
    int maxInstances, const std::vector<int32_t> &classIndices,
    bool returnMaskAtOriginalResolution) {

  if (confidenceThreshold <= 0 || confidenceThreshold > 1) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Confidence threshold must be greater than 0 "
                            "and less than or equal to 1.");
  }

  if (iouThreshold <= 0 || iouThreshold > 1) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "IoU threshold must be greater than 0 "
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

  int N = bboxTensor.size(1);
  int maskH = maskTensor.size(2);
  int maskW = maskTensor.size(3);

  const float *bboxData =
      static_cast<const float *>(bboxTensor.const_data_ptr());
  const float *scoresData =
      static_cast<const float *>(scoresTensor.const_data_ptr());
  const float *maskData =
      static_cast<const float *>(maskTensor.const_data_ptr());
  int32_t processed = 0;

  for (int i = 0; i < N; ++i) {
    float x1 = bboxData[i * 4 + 0];
    float y1 = bboxData[i * 4 + 1];
    float x2 = bboxData[i * 4 + 2];
    float y2 = bboxData[i * 4 + 3];
    float score = scoresData[i * 2 + 0];
    auto labelIdx = static_cast<std::size_t>(scoresData[i * 2 + 1]);

    if (score < confidenceThreshold)
      continue;
    if (!allowedClasses.empty() && allowedClasses.find(static_cast<int32_t>(
                                       labelIdx)) == allowedClasses.end())
      continue;

    if (labelIdx >= labelNames_.size()) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::InvalidConfig,
          "Model output class index " + std::to_string(labelIdx) +
              " exceeds labelNames size " + std::to_string(labelNames_.size()) +
              ". Ensure the labelMap covers all model output classes.");
    }

    // Scale bbox to original image coordinates
    float origX1 = x1 * widthRatio;
    float origY1 = y1 * heightRatio;
    float origX2 = x2 * widthRatio;
    float origY2 = y2 * heightRatio;

    int bboxW = static_cast<int>(std::round(origX2 - origX1));
    int bboxH = static_cast<int>(std::round(origY2 - origY1));

    if (bboxW <= 0 || bboxH <= 0)
      continue;

    // Wrap logits in cv::Mat for vectorized operations
    const float *logits = maskData + (i * maskH * maskW);
    cv::Mat logitsMat(maskH, maskW, CV_32FC1, const_cast<float *>(logits));

    // Float bounds in low-res mask space
    float mx1F = x1 * maskW / modelInputSize.width;
    float my1F = y1 * maskH / modelInputSize.height;
    float mx2F = x2 * maskW / modelInputSize.width;
    float my2F = y2 * maskH / modelInputSize.height;

    // Exact integer bounds (bbox region in mask coordinates)
    int mx1 = std::max(0, static_cast<int>(std::floor(mx1F)));
    int my1 = std::max(0, static_cast<int>(std::floor(my1F)));
    int mx2 = std::min(maskW, static_cast<int>(std::ceil(mx2F)));
    int my2 = std::min(maskH, static_cast<int>(std::ceil(my2F)));

    if (mx2 <= mx1 || my2 <= my1)
      continue;

    cv::Mat finalBinaryMat;
    int finalMaskWidth = bboxW;
    int finalMaskHeight = bboxH;

    if (returnMaskAtOriginalResolution) {
      // 1px padding for warpAffine interpolation (prevents edge artifacts)
      int pmx1 = std::max(0, mx1 - 1);
      int pmy1 = std::max(0, my1 - 1);
      int pmx2 = std::min(maskW, mx2 + 1);
      int pmy2 = std::min(maskH, my2 + 1);

      cv::Mat croppedLogits =
          logitsMat(cv::Rect(pmx1, pmy1, pmx2 - pmx1, pmy2 - pmy1));
      cv::Mat probMat;
      cv::exp(-croppedLogits, probMat);
      probMat = 255.0f / (1.0f + probMat);
      probMat.convertTo(probMat, CV_8UC1);

      // Affine matrix mapping padded crop -> bbox in original image space.
      // Padding pixels fall outside the output and are clipped naturally.
      float maskToOrigX = static_cast<float>(originalSize.width) / maskW;
      float maskToOrigY = static_cast<float>(originalSize.height) / maskH;

      cv::Mat M = (cv::Mat_<float>(2, 3) << maskToOrigX, 0,
                   (pmx1 * maskToOrigX - origX1), 0, maskToOrigY,
                   (pmy1 * maskToOrigY - origY1));

      cv::Mat warpedMat;
      cv::warpAffine(probMat, warpedMat, M, cv::Size(bboxW, bboxH),
                     cv::INTER_LINEAR);

      cv::threshold(warpedMat, finalBinaryMat, 127, 1, cv::THRESH_BINARY);
    } else {
      // No padding needed — no interpolation, just threshold
      cv::Mat croppedLogits =
          logitsMat(cv::Rect(mx1, my1, mx2 - mx1, my2 - my1));
      cv::Mat probMat;
      cv::exp(-croppedLogits, probMat);
      probMat = 255.0f / (1.0f + probMat);
      probMat.convertTo(probMat, CV_8UC1);

      cv::threshold(probMat, finalBinaryMat, 127, 1, cv::THRESH_BINARY);
      finalMaskWidth = finalBinaryMat.cols;
      finalMaskHeight = finalBinaryMat.rows;
    }

    std::vector<uint8_t> finalMask(
        finalBinaryMat.data, finalBinaryMat.data + finalBinaryMat.total());

    types::InstanceMask instance;
    instance.x1 = origX1;
    instance.y1 = origY1;
    instance.x2 = origX2;
    instance.y2 = origY2;
    instance.mask = std::move(finalMask);
    instance.maskWidth = finalMaskWidth;
    instance.maskHeight = finalMaskHeight;
    instance.label = labelNames_[labelIdx];
    instance.score = score;
    instance.instanceId = i;
    instances.push_back(std::move(instance));
    ++processed;
  }

  // Finalize: NMS + limit + renumber
  if (applyNMS_ && iouThreshold < 0.45) {
    instances = nonMaxSuppression(instances, iouThreshold);
  }

  if (instances.size() > static_cast<size_t>(maxInstances)) {
    instances.resize(maxInstances);
  }

  for (size_t i = 0; i < instances.size(); ++i) {
    instances[i].instanceId = static_cast<int>(i);
  }

  return instances;
}

std::vector<types::InstanceMask> BaseInstanceSegmentation::generate(
    std::string imageSource, double confidenceThreshold, double iouThreshold,
    int maxInstances, std::vector<int32_t> classIndices,
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
