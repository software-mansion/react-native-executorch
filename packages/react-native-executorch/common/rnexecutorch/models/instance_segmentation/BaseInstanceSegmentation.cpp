#include "BaseInstanceSegmentation.h"

#include <cmath>
#include <iostream>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch::models::instance_segmentation {

BaseInstanceSegmentation::BaseInstanceSegmentation(
    const std::string &modelSource, const std::string &postprocessorType,
    std::vector<float> normMean, std::vector<float> normStd, bool applyNMS,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker),
      postprocessorType_(postprocessorType), applyNMS_(applyNMS) {
  if (postprocessorType_ != "yolo" && postprocessorType_ != "rfdetr") {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidConfig,
        "Postprocessor type must be 'yolo' or 'rfdetr'. Got: " +
            postprocessorType_);
  }

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

  if (postprocessorType_ == "rfdetr") {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "RF-DETR not implemented in this POC build.");
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
  if (numTensors < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Expected at least 2 output tensors, got " +
                                std::to_string(numTensors));
  }

  auto firstTensor = tensors[0].toTensor();
  int featureDim = firstTensor.size(firstTensor.dim() - 1);

  // ════════════════════════════════════════════════════════════
  // FORMAT A — YOLO NATIVE: [1,N,38] + [1,32,H,W]
  //   Detection tensor: [x1,y1,x2,y2, score, class, coeff×32]
  //   C++ computes: coefficients @ prototypes → mask per detection
  // ════════════════════════════════════════════════════════════
  if (featureDim == 38 && numTensors == 2) {

    auto detectionTensor = tensors[0].toTensor();
    auto protoTensor = tensors[1].toTensor();

    if (protoTensor.dim() != 4 || protoTensor.size(1) != 32) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::UnexpectedNumInputs,
          "Expected prototype mask tensor shape [1, 32, H, W]");
    }

    int maxDetections = detectionTensor.size(1);
    int protoHeight = protoTensor.size(2);
    int protoWidth = protoTensor.size(3);
    const float *detData =
        static_cast<const float *>(detectionTensor.const_data_ptr());
    const float *protoData =
        static_cast<const float *>(protoTensor.const_data_ptr());

    for (int i = 0; i < maxDetections; ++i) {
      const float *det = detData + (i * 38);

      float x1 = det[0];
      float y1 = det[1];
      float x2 = det[2];
      float y2 = det[3];
      float score = det[4];
      int label = static_cast<int>(det[5]);

      if (score < confidenceThreshold)
        continue;
      if (!allowedClasses.empty() &&
          allowedClasses.find(label) == allowedClasses.end())
        continue;

      // mask = coefficients @ prototypes
      std::vector<float> instanceMask(protoHeight * protoWidth, 0.0f);
      for (int m = 0; m < 32; m++) {
        float coef = det[6 + m];
        const float *proto = protoData + (m * protoHeight * protoWidth);
        for (int p = 0; p < protoHeight * protoWidth; p++) {
          instanceMask[p] += coef * proto[p];
        }
      }

      std::vector<uint8_t> binaryMask(protoHeight * protoWidth);
      for (int j = 0; j < protoHeight * protoWidth; j++) {
        float v = 1.0f / (1.0f + std::exp(-instanceMask[j]));
        binaryMask[j] = (v > 0.5f) ? 1 : 0;
      }

      x1 *= widthRatio;
      y1 *= heightRatio;
      x2 *= widthRatio;
      y2 *= heightRatio;

      int finalMaskWidth = protoWidth;
      int finalMaskHeight = protoHeight;
      std::vector<uint8_t> finalMask = binaryMask;

      if (returnMaskAtOriginalResolution) {
        cv::Mat maskMat(protoHeight, protoWidth, CV_8UC1, binaryMask.data());
        cv::Mat resizedMaskMat;
        cv::resize(maskMat, resizedMaskMat, originalSize, 0, 0,
                   cv::INTER_NEAREST);
        finalMaskWidth = originalSize.width;
        finalMaskHeight = originalSize.height;
        for (int y = 0; y < finalMaskHeight; y++)
          for (int x = 0; x < finalMaskWidth; x++)
            if (x < x1 || x > x2 || y < y1 || y > y2)
              resizedMaskMat.data[y * finalMaskWidth + x] = 0;
        finalMask.assign(resizedMaskMat.data,
                         resizedMaskMat.data + resizedMaskMat.total());
      }

      types::InstanceMask instance;
      instance.x1 = x1;
      instance.y1 = y1;
      instance.x2 = x2;
      instance.y2 = y2;
      instance.mask = std::move(finalMask);
      instance.maskWidth = finalMaskWidth;
      instance.maskHeight = finalMaskHeight;
      instance.label = label;
      instance.score = score;
      instance.instanceId = i;
      instances.push_back(std::move(instance));
    }
  }
  // ════════════════════════════════════════════════════════════
  // FORMAT B — CONTRACT: [1,N,4] + [1,N,2] + [1,N,H,W]
  //   bbox:        x1,y1,x2,y2 in model-input coordinates
  //   scores:      (max_score, class_id)  — score is post-sigmoid
  //   mask_logits: pre-sigmoid, per-detection, at whatever resolution
  //                the export chose (128×128, 64×64, 32×32, etc.)
  // ════════════════════════════════════════════════════════════
  else if (featureDim == 4 && numTensors == 3) {

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

    for (int i = 0; i < N; ++i) {
      float x1 = bboxData[i * 4 + 0];
      float y1 = bboxData[i * 4 + 1];
      float x2 = bboxData[i * 4 + 2];
      float y2 = bboxData[i * 4 + 3];
      float score = scoresData[i * 2 + 0];
      int label = static_cast<int>(scoresData[i * 2 + 1]);

      if (score < confidenceThreshold)
        continue;
      if (!allowedClasses.empty() &&
          allowedClasses.find(label) == allowedClasses.end())
        continue;

      // Mask logits are pre-computed — just sigmoid + threshold
      const float *logits = maskData + (i * maskH * maskW);
      std::vector<uint8_t> binaryMask(maskH * maskW);
      for (int j = 0; j < maskH * maskW; j++) {
        float v = 1.0f / (1.0f + std::exp(-logits[j]));
        binaryMask[j] = (v > 0.5f) ? 1 : 0;
      }

      x1 *= widthRatio;
      y1 *= heightRatio;
      x2 *= widthRatio;
      y2 *= heightRatio;

      int finalMaskWidth = maskW;
      int finalMaskHeight = maskH;
      std::vector<uint8_t> finalMask = binaryMask;

      if (returnMaskAtOriginalResolution) {
        cv::Mat maskMat(maskH, maskW, CV_8UC1, binaryMask.data());
        cv::Mat resizedMaskMat;
        cv::resize(maskMat, resizedMaskMat, originalSize, 0, 0,
                   cv::INTER_NEAREST);
        finalMaskWidth = originalSize.width;
        finalMaskHeight = originalSize.height;
        for (int y = 0; y < finalMaskHeight; y++)
          for (int x = 0; x < finalMaskWidth; x++)
            if (x < x1 || x > x2 || y < y1 || y > y2)
              resizedMaskMat.data[y * finalMaskWidth + x] = 0;
        finalMask.assign(resizedMaskMat.data,
                         resizedMaskMat.data + resizedMaskMat.total());
      }

      types::InstanceMask instance;
      instance.x1 = x1;
      instance.y1 = y1;
      instance.x2 = x2;
      instance.y2 = y2;
      instance.mask = std::move(finalMask);
      instance.maskWidth = finalMaskWidth;
      instance.maskHeight = finalMaskHeight;
      instance.label = label;
      instance.score = score;
      instance.instanceId = i;
      instances.push_back(std::move(instance));
    }
  }
  // ════════════════════════════════════════════════════════════
  // FORMAT C — COEFFS+PROTOS: [1,N,4] + [1,N,2] + [1,N,32] + [1,32,H,W]
  //   Same bbox/scores as contract, but masks are NOT pre-computed.
  //   C++ computes masks only for detections that pass the filter,
  //   which is far cheaper than doing bmm for all 300 in the model.
  // ════════════════════════════════════════════════════════════
  else if (featureDim == 4 && numTensors == 4) {

    auto bboxTensor = tensors[0].toTensor();   // [1, N, 4]
    auto scoresTensor = tensors[1].toTensor(); // [1, N, 2]
    auto coeffsTensor = tensors[2].toTensor(); // [1, N, nm]
    auto protoTensor = tensors[3].toTensor();  // [1, nm, H, W]

    int N = bboxTensor.size(1);
    int nm = coeffsTensor.size(2);
    int protoH = protoTensor.size(2);
    int protoW = protoTensor.size(3);

    const float *bboxData =
        static_cast<const float *>(bboxTensor.const_data_ptr());
    const float *scoresData =
        static_cast<const float *>(scoresTensor.const_data_ptr());
    const float *coeffsData =
        static_cast<const float *>(coeffsTensor.const_data_ptr());
    const float *protoData =
        static_cast<const float *>(protoTensor.const_data_ptr());

    for (int i = 0; i < N; ++i) {
      float x1 = bboxData[i * 4 + 0];
      float y1 = bboxData[i * 4 + 1];
      float x2 = bboxData[i * 4 + 2];
      float y2 = bboxData[i * 4 + 3];
      float score = scoresData[i * 2 + 0];
      int label = static_cast<int>(scoresData[i * 2 + 1]);

      if (score < confidenceThreshold)
        continue;
      if (!allowedClasses.empty() &&
          allowedClasses.find(label) == allowedClasses.end())
        continue;

      // Compute mask: coeffs[i] @ protos → [protoH * protoW]
      const float *coeffs = coeffsData + (i * nm);
      std::vector<float> instanceMask(protoH * protoW, 0.0f);
      for (int m = 0; m < nm; m++) {
        float coef = coeffs[m];
        const float *proto = protoData + (m * protoH * protoW);
        for (int p = 0; p < protoH * protoW; p++) {
          instanceMask[p] += coef * proto[p];
        }
      }

      std::vector<uint8_t> binaryMask(protoH * protoW);
      for (int j = 0; j < protoH * protoW; j++) {
        float v = 1.0f / (1.0f + std::exp(-instanceMask[j]));
        binaryMask[j] = (v > 0.5f) ? 1 : 0;
      }

      x1 *= widthRatio;
      y1 *= heightRatio;
      x2 *= widthRatio;
      y2 *= heightRatio;

      int finalMaskWidth = protoW;
      int finalMaskHeight = protoH;
      std::vector<uint8_t> finalMask = binaryMask;

      if (returnMaskAtOriginalResolution) {
        cv::Mat maskMat(protoH, protoW, CV_8UC1, binaryMask.data());
        cv::Mat resizedMaskMat;
        cv::resize(maskMat, resizedMaskMat, originalSize, 0, 0,
                   cv::INTER_NEAREST);
        finalMaskWidth = originalSize.width;
        finalMaskHeight = originalSize.height;
        for (int y = 0; y < finalMaskHeight; y++)
          for (int x = 0; x < finalMaskWidth; x++)
            if (x < x1 || x > x2 || y < y1 || y > y2)
              resizedMaskMat.data[y * finalMaskWidth + x] = 0;
        finalMask.assign(resizedMaskMat.data,
                         resizedMaskMat.data + resizedMaskMat.total());
      }

      types::InstanceMask instance;
      instance.x1 = x1;
      instance.y1 = y1;
      instance.x2 = x2;
      instance.y2 = y2;
      instance.mask = std::move(finalMask);
      instance.maskWidth = finalMaskWidth;
      instance.maskHeight = finalMaskHeight;
      instance.label = label;
      instance.score = score;
      instance.instanceId = i;
      instances.push_back(std::move(instance));
    }
  }
  // ════════════════════════════════════════════════════════════
  else {
    throw RnExecutorchError(
        RnExecutorchErrorCode::UnexpectedNumInputs,
        "Unrecognized output format: " + std::to_string(numTensors) +
            " tensors, first tensor last dim = " + std::to_string(featureDim) +
            ". Expected YOLO native (2 tensors, dim=38), contract (3 tensors, "
            "dim=4), or coeffs+protos (4 tensors, dim=4).");
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
    bool returnMaskAtOriginalResolution, int32_t inputSize) {

  std::string methodName = getMethodName(inputSize);
  if (currentlyLoadedMethod_ == "") {
    currentlyLoadedMethod_ = methodName;
  } else {
    module_->unload_method(currentlyLoadedMethod_);
    currentlyLoadedMethod_ = methodName;
  }
  module_->load_method(methodName);
  cv::Size modelInputSize(inputSize, inputSize);
  std::vector<int32_t> inputShape = {1, 3, inputSize, inputSize};

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

  return postprocess(forwardResult.get(), originalSize, modelInputSize,
                     confidenceThreshold, iouThreshold, maxInstances,
                     classIndices, returnMaskAtOriginalResolution);
}

} // namespace rnexecutorch::models::instance_segmentation
