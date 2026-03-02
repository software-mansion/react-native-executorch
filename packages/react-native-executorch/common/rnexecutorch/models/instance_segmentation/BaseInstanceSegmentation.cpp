#include "BaseInstanceSegmentation.h"

#include <cmath>
#include <iostream>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
namespace rnexecutorch::models::instance_segmentation {

BaseInstanceSegmentation::BaseInstanceSegmentation(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, bool applyNMS,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), applyNMS_(applyNMS) {
  // Store normalization parameters if provided
  if (normMean.size() == 3) {
    normMean_ = cv::Scalar(normMean[0], normMean[1], normMean[2]);
  }
  if (normStd.size() == 3) {
    normStd_ = cv::Scalar(normStd[0], normStd[1], normStd[2]);
  }

  // For multi-method models, we set a default size
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

  // Sort by score (descending)
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

      // Only suppress if same class
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

  // Validate parameters
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

  // DEBUG: Log tensor information
  std::cout << "\n=== Model Output Debug ===" << std::endl;
  std::cout << "Number of output tensors: " << tensors.size() << std::endl;
  for (size_t i = 0; i < tensors.size(); ++i) {
    auto tensor = tensors[i].toTensor();
    std::cout << "Tensor " << i << ": dim=" << tensor.dim() << ", shape=[";
    for (int d = 0; d < tensor.dim(); ++d) {
      std::cout << tensor.size(d);
      if (d < tensor.dim() - 1)
        std::cout << ", ";
    }
    std::cout << "]" << std::endl;
  }
  std::cout << "========================\n" << std::endl;

  // Auto-detect model output format based on first few tensor shapes
  // Models may output additional intermediate tensors that we ignore

  bool isRFDetr = false;
  bool isYOLO = false;

  if (tensors.size() >= 3) {
    // Check if first 3 tensors match RFDetr format
    isRFDetr =
        (tensors[0].toTensor().dim() == 3 &&
         tensors[0].toTensor().size(2) == 4 &&
         tensors[1].toTensor().dim() == 3 && tensors[2].toTensor().dim() == 4);
  }

  if (tensors.size() >= 2 && !isRFDetr) {
    // Check if first 2 tensors match YOLO format
    isYOLO = (tensors[0].toTensor().dim() == 3 &&
              tensors[0].toTensor().size(2) == 38 &&
              tensors[1].toTensor().dim() == 4 &&
              tensors[1].toTensor().size(1) == 32);
  }

  if (!isRFDetr && !isYOLO) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Unknown model output format. First tensors don't "
                            "match YOLO or RFDetr.");
  }

  // Create allowed classes set for filtering
  auto allowedClasses = createAllowedClassesSet(classIndices);

  // Delegate to model-specific postprocessing
  std::vector<types::InstanceMask> instances;

  if (isRFDetr) {
    instances = postprocessRFDetr(tensors, originalSize, modelInputSize,
                                  confidenceThreshold, allowedClasses,
                                  returnMaskAtOriginalResolution);
  } else {
    instances = postprocessYOLO(tensors, originalSize, modelInputSize,
                                confidenceThreshold, allowedClasses,
                                returnMaskAtOriginalResolution);
  }

  return finalizeInstances(instances, iouThreshold, maxInstances);
}

// Helper: Create allowed classes set from vector
std::set<int32_t> BaseInstanceSegmentation::createAllowedClassesSet(
    const std::vector<int32_t> &classIndices) {
  if (classIndices.empty()) {
    return {};
  }
  return std::set<int32_t>(classIndices.begin(), classIndices.end());
}

// Helper: Apply sigmoid and threshold to convert logits to binary mask
std::vector<uint8_t>
BaseInstanceSegmentation::applySigmoidAndThreshold(const float *logits,
                                                   int size) {
  std::vector<uint8_t> binaryMask(size);
  for (int i = 0; i < size; ++i) {
    float prob = 1.0f / (1.0f + std::exp(-logits[i]));
    binaryMask[i] = (prob > 0.5f) ? 1 : 0;
  }
  return binaryMask;
}

// RFDetr-specific postprocessing
std::vector<types::InstanceMask> BaseInstanceSegmentation::postprocessRFDetr(
    const std::vector<EValue> &tensors, cv::Size originalSize,
    cv::Size modelInputSize, double confidenceThreshold,
    const std::set<int32_t> &allowedClasses,
    bool returnMaskAtOriginalResolution) {

  // Tensor 0: [1, N, 4] - Bounding boxes (cxcywh normalized)
  // Tensor 1: [1, N, 91] - Class logits (pre-sigmoid)
  // Tensor 2: [1, N, H, W] - Mask logits (pre-sigmoid)

  auto bboxTensor = tensors[0].toTensor();
  auto classLogitsTensor = tensors[1].toTensor();
  auto maskLogitsTensor = tensors[2].toTensor();

  int numDetections = bboxTensor.size(1);
  int numClasses = classLogitsTensor.size(2);
  int maskHeight = maskLogitsTensor.size(2);
  int maskWidth = maskLogitsTensor.size(3);

  const float *bboxData =
      static_cast<const float *>(bboxTensor.const_data_ptr());
  const float *classLogitsData =
      static_cast<const float *>(classLogitsTensor.const_data_ptr());
  const float *maskLogitsData =
      static_cast<const float *>(maskLogitsTensor.const_data_ptr());

  float widthRatio =
      static_cast<float>(originalSize.width) / modelInputSize.width;
  float heightRatio =
      static_cast<float>(originalSize.height) / modelInputSize.height;

  std::vector<types::InstanceMask> instances;

  for (int i = 0; i < numDetections; ++i) {
    // Parse class logits and apply sigmoid to get probabilities
    const float *logits = classLogitsData + (i * numClasses);
    float maxScore = -std::numeric_limits<float>::infinity();
    int maxClass = -1;

    for (int c = 0; c < numClasses; ++c) {
      // Apply sigmoid: 1 / (1 + exp(-x))
      float prob = 1.0f / (1.0f + std::exp(-logits[c]));
      if (prob > maxScore) {
        maxScore = prob;
        maxClass = c;
      }
    }

    // Skip if below confidence threshold
    if (maxScore < confidenceThreshold) {
      continue;
    }

    // Filter by class if specified (use 1-indexed for COCO compatibility)
    if (!allowedClasses.empty() &&
        allowedClasses.find(maxClass) == allowedClasses.end()) {
      continue;
    }

    // Parse bounding box (cxcywh normalized [0, 1])
    const float *bbox = bboxData + (i * 4);
    float cx_norm = bbox[0];
    float cy_norm = bbox[1];
    float w_norm = bbox[2];
    float h_norm = bbox[3];

    // Convert normalized cxcywh to absolute xyxy (scaled to model input size)
    float cx = cx_norm * modelInputSize.width;
    float cy = cy_norm * modelInputSize.height;
    float w = w_norm * modelInputSize.width;
    float h = h_norm * modelInputSize.height;

    float x1_model = cx - w / 2.0f;
    float y1_model = cy - h / 2.0f;
    float x2_model = cx + w / 2.0f;
    float y2_model = cy + h / 2.0f;

    // Scale to original image size
    float widthRatio =
        static_cast<float>(originalSize.width) / modelInputSize.width;
    float heightRatio =
        static_cast<float>(originalSize.height) / modelInputSize.height;

    float x1 = x1_model * widthRatio;
    float y1 = y1_model * heightRatio;
    float x2 = x2_model * widthRatio;
    float y2 = y2_model * heightRatio;

    // Apply sigmoid to mask logits and threshold
    const float *maskLogits = maskLogitsData + (i * maskHeight * maskWidth);
    std::vector<uint8_t> binaryMask =
        applySigmoidAndThreshold(maskLogits, maskHeight * maskWidth);

    // Resize and crop mask
    int finalMaskWidth, finalMaskHeight;
    std::vector<uint8_t> finalMask = resizeAndCropMask(
        binaryMask, maskWidth, maskHeight, originalSize, x1, y1, x2, y2,
        returnMaskAtOriginalResolution, finalMaskWidth, finalMaskHeight);

    types::InstanceMask instance;
    instance.x1 = x1;
    instance.y1 = y1;
    instance.x2 = x2;
    instance.y2 = y2;
    instance.mask = std::move(finalMask);
    instance.maskWidth = finalMaskWidth;
    instance.maskHeight = finalMaskHeight;
    instance.label = maxClass;
    instance.score = maxScore;
    instance.instanceId = i;

    instances.push_back(std::move(instance));
  }

  return instances;
}

// YOLO-specific postprocessing
std::vector<types::InstanceMask> BaseInstanceSegmentation::postprocessYOLO(
    const std::vector<EValue> &tensors, cv::Size originalSize,
    cv::Size modelInputSize, double confidenceThreshold,
    const std::set<int32_t> &allowedClasses,
    bool returnMaskAtOriginalResolution) {

  // Tensor 0: [1, N, 38] - Detections (x1, y1, x2, y2, score, class, mask_coef
  // x32) Tensor 1: [1, 32, H, W] - Prototype masks

  auto detectionTensor = tensors[0].toTensor();
  auto protoTensor = tensors[1].toTensor();

  if (protoTensor.dim() != 4 || protoTensor.size(1) != 32) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::UnexpectedNumInputs,
        "Expected prototype mask tensor shape [1, 32, H, W]");
  }

  int numDetections = detectionTensor.size(1);
  int protoHeight = protoTensor.size(2);
  int protoWidth = protoTensor.size(3);

  const float *detectionData =
      static_cast<const float *>(detectionTensor.const_data_ptr());
  const float *protoData =
      static_cast<const float *>(protoTensor.const_data_ptr());

  float widthRatio =
      static_cast<float>(originalSize.width) / modelInputSize.width;
  float heightRatio =
      static_cast<float>(originalSize.height) / modelInputSize.height;

  std::vector<types::InstanceMask> instances;

  for (int i = 0; i < numDetections; ++i) {
    // Each detection: [x1, y1, x2, y2, score, class, mask_coef_0...31]
    const float *detection = detectionData + (i * 38);

    float x1 = detection[0];
    float y1 = detection[1];
    float x2 = detection[2];
    float y2 = detection[3];
    float score = detection[4];
    int label = static_cast<int>(detection[5]);

    // Skip if below confidence threshold
    if (score < confidenceThreshold) {
      continue;
    }

    // Filter by class if specified
    if (!allowedClasses.empty() &&
        allowedClasses.find(label) == allowedClasses.end()) {
      continue;
    }

    // Extract mask coefficients (32 values starting at index 6)
    std::vector<float> maskCoefficients(32);
    for (int j = 0; j < 32; j++) {
      maskCoefficients[j] = detection[6 + j];
    }

    // Generate instance mask by multiplying coefficients with prototype masks
    std::vector<float> instanceMask(protoHeight * protoWidth, 0.0f);

    for (int maskIdx = 0; maskIdx < 32; maskIdx++) {
      float coef = maskCoefficients[maskIdx];
      const float *protoMask = protoData + (maskIdx * protoHeight * protoWidth);

      for (int pixelIdx = 0; pixelIdx < protoHeight * protoWidth; pixelIdx++) {
        instanceMask[pixelIdx] += coef * protoMask[pixelIdx];
      }
    }

    // Apply sigmoid and threshold
    std::vector<uint8_t> binaryMask =
        applySigmoidAndThreshold(instanceMask.data(), protoHeight * protoWidth);

    // Scale bounding box to original image size
    x1 *= widthRatio;
    y1 *= heightRatio;
    x2 *= widthRatio;
    y2 *= heightRatio;

    // Resize and crop mask
    int finalMaskWidth, finalMaskHeight;
    std::vector<uint8_t> finalMask = resizeAndCropMask(
        binaryMask, protoWidth, protoHeight, originalSize, x1, y1, x2, y2,
        returnMaskAtOriginalResolution, finalMaskWidth, finalMaskHeight);

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

  return instances;
}

// Helper function: Resize mask to original resolution and crop to bounding box
std::vector<uint8_t> BaseInstanceSegmentation::resizeAndCropMask(
    const std::vector<uint8_t> &mask, int maskWidth, int maskHeight,
    cv::Size originalSize, float x1, float y1, float x2, float y2,
    bool returnAtOriginalResolution, int &outWidth, int &outHeight) {

  if (!returnAtOriginalResolution) {
    outWidth = maskWidth;
    outHeight = maskHeight;
    return mask;
  }

  // Resize mask to original image size
  cv::Mat maskMat(maskHeight, maskWidth, CV_8UC1,
                  const_cast<uint8_t *>(mask.data()));
  cv::Mat resizedMaskMat;
  cv::resize(maskMat, resizedMaskMat, originalSize, 0, 0, cv::INTER_NEAREST);

  outWidth = originalSize.width;
  outHeight = originalSize.height;

  // Crop mask to bounding box (zero out pixels outside bbox)
  for (int y = 0; y < outHeight; y++) {
    for (int x = 0; x < outWidth; x++) {
      int idx = y * outWidth + x;
      if (x < x1 || x > x2 || y < y1 || y > y2) {
        resizedMaskMat.data[idx] = 0;
      }
    }
  }

  std::vector<uint8_t> result(resizedMaskMat.data,
                              resizedMaskMat.data + resizedMaskMat.total());
  return result;
}

// Helper function: Apply NMS, limit instances, and renumber IDs
std::vector<types::InstanceMask> BaseInstanceSegmentation::finalizeInstances(
    std::vector<types::InstanceMask> instances, double iouThreshold,
    int maxInstances) {

  // Apply NMS if enabled
  if (applyNMS_) {
    instances = nonMaxSuppression(instances, iouThreshold);
  }

  // Limit to maxInstances
  if (instances.size() > static_cast<size_t>(maxInstances)) {
    instances.resize(maxInstances);
  }

  // Renumber instance IDs to be sequential
  for (size_t i = 0; i < instances.size(); ++i) {
    instances[i].instanceId = static_cast<int>(i);
  }

  return instances;
}

std::vector<types::InstanceMask> BaseInstanceSegmentation::generate(
    std::string imageSource, double confidenceThreshold, double iouThreshold,
    int maxInstances, std::vector<int32_t> classIndices,
    bool returnMaskAtOriginalResolution, int32_t inputSize) {

  std::string methodName;
  cv::Size modelInputSize;
  std::vector<int32_t> inputShape;

  if (inputSize == 0) {
    // Single-method model: use 'forward' and auto-detect input shape
    methodName = "forward";

    // Get input shape from model metadata
    auto inputShapeVec = getInputShape(methodName, 0);
    if (inputShapeVec.size() != 4) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::UnexpectedNumInputs,
          "Expected 4D input tensor [batch, channels, height, width], got " +
              std::to_string(inputShapeVec.size()) + "D");
    }

    int32_t height = inputShapeVec[2];
    int32_t width = inputShapeVec[3];
    modelInputSize = cv::Size(width, height);
    inputShape = {1, 3, height, width};

  } else {
    // Multi-method model: use 'forward_{size}'
    methodName = getMethodName(inputSize);
    modelInputSize = cv::Size(inputSize, inputSize);
    inputShape = {1, 3, inputSize, inputSize};
  }

  // Read and preprocess image with optional normalization
  // readImageToTensor will apply normalization if normMean_ and normStd_ are
  // provided
  auto [inputTensor, originalSize] = image_processing::readImageToTensor(
      imageSource, inputShape, false, normMean_, normStd_);

  // Execute model
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
