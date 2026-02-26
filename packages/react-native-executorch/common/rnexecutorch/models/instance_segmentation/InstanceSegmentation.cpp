#include "InstanceSegmentation.h"

#include <cmath>
#include <iostream>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
namespace rnexecutorch::models::instance_segmentation {

InstanceSegmentation::InstanceSegmentation(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  // For multi-method models (like YOLO with forward_512, forward_640, etc.),
  // we can't use getAllInputShapes() as it requires a default "forward" method.
  // Instead, we'll set a default size. The YOLO models typically use 512x512
  // input. If you need a different size, modify this or the model export to
  // include a default forward method.
  modelImageSize = cv::Size(512, 512);
}

float InstanceSegmentation::intersectionOverUnion(
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

std::vector<types::InstanceMask> InstanceSegmentation::nonMaxSuppression(
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

std::vector<types::InstanceMask> InstanceSegmentation::postprocess(
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

  std::vector<types::InstanceMask> instances;

  // ACTUAL tensor format from YOLO instance segmentation:
  // tensors[0]: [1, 300, 38] - postprocessed detections
  //             Format per detection: [x1, y1, x2, y2, score, class,
  //             mask_coef_0...31]
  // tensors[1]: [1, 32, 128, 128] - prototype masks

  if (tensors.size() < 2) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::UnexpectedNumInputs,
        "Expected at least 2 output tensors (detections, prototype masks).");
  }

  // Parse Tensor 0: postprocessed detections [1, 300, 38]
  auto detectionTensor = tensors.at(0).toTensor();
  if (detectionTensor.dim() != 3 || detectionTensor.size(2) != 38) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Expected detection tensor shape [1, N, 38]");
  }

  int maxDetections = detectionTensor.size(1);
  const float *detectionData =
      static_cast<const float *>(detectionTensor.const_data_ptr());

  // Parse Tensor 1: prototype masks [1, 32, H, W]
  auto protoTensor = tensors.at(1).toTensor();
  if (protoTensor.dim() != 4 || protoTensor.size(1) != 32) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::UnexpectedNumInputs,
        "Expected prototype mask tensor shape [1, 32, H, W]");
  }

  int protoHeight = protoTensor.size(2);
  int protoWidth = protoTensor.size(3);
  const float *protoData =
      static_cast<const float *>(protoTensor.const_data_ptr());

  // Create a set for fast class lookup if classIndices is provided
  std::set<int32_t> allowedClasses;
  if (!classIndices.empty()) {
    allowedClasses.insert(classIndices.begin(), classIndices.end());
  }

  // Parse each detection from Tensor 0
  for (int i = 0; i < maxDetections; ++i) {
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
    // Result: [protoHeight, protoWidth]
    std::vector<float> instanceMask(protoHeight * protoWidth, 0.0f);

    for (int maskIdx = 0; maskIdx < 32; maskIdx++) {
      float coef = maskCoefficients[maskIdx];
      const float *protoMask = protoData + (maskIdx * protoHeight * protoWidth);

      for (int pixelIdx = 0; pixelIdx < protoHeight * protoWidth; pixelIdx++) {
        instanceMask[pixelIdx] += coef * protoMask[pixelIdx];
      }
    }

    // Apply sigmoid to mask values and threshold
    std::vector<uint8_t> binaryMask(protoHeight * protoWidth);
    for (int j = 0; j < protoHeight * protoWidth; j++) {
      // Sigmoid: 1 / (1 + exp(-x))
      float maskValue = 1.0f / (1.0f + std::exp(-instanceMask[j]));
      binaryMask[j] = (maskValue > 0.5f) ? 1 : 0;
    }

    // Scale bounding box to original image size first
    x1 *= widthRatio;
    y1 *= heightRatio;
    x2 *= widthRatio;
    y2 *= heightRatio;

    // Resize mask if needed
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

      // Crop mask to bounding box (removes artifacts outside bbox)
      for (int y = 0; y < finalMaskHeight; y++) {
        for (int x = 0; x < finalMaskWidth; x++) {
          int idx = y * finalMaskWidth + x;
          // Zero out pixels outside the bounding box
          if (x < x1 || x > x2 || y < y1 || y > y2) {
            resizedMaskMat.data[idx] = 0;
          }
        }
      }

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

  // Note: The model already applies NMS internally, but we can apply it again
  // if requested with a different IoU threshold
  if (iouThreshold < 0.45) {
    // Only apply additional NMS if threshold is stricter than model's default
    instances = nonMaxSuppression(instances, iouThreshold);
  }

  // Limit to maxInstances
  if (instances.size() > static_cast<size_t>(maxInstances)) {
    instances.resize(maxInstances);
  }

  // Update instance IDs to be sequential
  for (size_t i = 0; i < instances.size(); ++i) {
    instances[i].instanceId = static_cast<int>(i);
  }

  return instances;
}

std::vector<types::InstanceMask> InstanceSegmentation::generate(
    std::string imageSource, double confidenceThreshold, double iouThreshold,
    int maxInstances, std::vector<int32_t> classIndices,
    bool returnMaskAtOriginalResolution, std::string methodName) {

  // Parse input size from method name (e.g., "forward_512" -> 512x512)
  cv::Size inputSize = modelImageSize; // Default to 512x512

  if (methodName.find("forward_") == 0) {
    std::string sizeStr = methodName.substr(8); // Skip "forward_"

    // Check for WxH format with 'x' (e.g., "640x384")
    size_t xPos = sizeStr.find('x');
    if (xPos != std::string::npos) {
      // Format: forward_WIDTHxHEIGHT
      int width = std::stoi(sizeStr.substr(0, xPos));
      int height = std::stoi(sizeStr.substr(xPos + 1));
      inputSize = cv::Size(width, height);
      std::cout << "[InstanceSeg] Parsed " << methodName << " -> W=" << width
                << " H=" << height << std::endl;
    } else {
      // Check for W_H format with underscore (e.g., "640_384")
      size_t underscorePos = sizeStr.find('_');
      if (underscorePos != std::string::npos) {
        // Format: forward_WIDTH_HEIGHT
        int width = std::stoi(sizeStr.substr(0, underscorePos));
        int height = std::stoi(sizeStr.substr(underscorePos + 1));
        inputSize = cv::Size(width, height);
        std::cout << "[InstanceSeg] Parsed " << methodName << " -> W=" << width
                  << " H=" << height << std::endl;
      } else {
        // Format: forward_SIZE (square)
        int size = std::stoi(sizeStr);
        inputSize = cv::Size(size, size);
        std::cout << "[InstanceSeg] Parsed " << methodName << " -> " << size
                  << "x" << size << std::endl;
      }
    }
  }

  // Create input shape based on parsed size
  std::vector<int32_t> inputShape = {1, 3, inputSize.height, inputSize.width};
  std::cout << "[InstanceSeg] Input tensor shape: [1, 3, " << inputSize.height
            << ", " << inputSize.width << "]" << std::endl;

  auto [inputTensor, originalSize] =
      image_processing::readImageToTensor(imageSource, inputShape);

  // Use the specified method name (e.g., "forward_512", "forward_640")
  auto forwardResult = BaseModel::execute(methodName, {inputTensor});
  if (!forwardResult.ok()) {
    throw RnExecutorchError(
        forwardResult.error(),
        "The model's forward function did not succeed. "
        "Ensure the model input is correct and method name is valid.");
  }

  return postprocess(forwardResult.get(), originalSize, inputSize,
                     confidenceThreshold, iouThreshold, maxInstances,
                     classIndices, returnMaskAtOriginalResolution);
}

} // namespace rnexecutorch::models::instance_segmentation
