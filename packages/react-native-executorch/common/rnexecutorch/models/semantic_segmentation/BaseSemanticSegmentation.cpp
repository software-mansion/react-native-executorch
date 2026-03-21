#include "BaseSemanticSegmentation.h"
#include "jsi/jsi.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/utils/FrameProcessor.h>
#include <rnexecutorch/utils/FrameTransform.h>

namespace rnexecutorch::models::semantic_segmentation {

BaseSemanticSegmentation::BaseSemanticSegmentation(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, std::vector<std::string> allClasses,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker),
      allClasses_(std::move(allClasses)) {
  initModelImageSize();
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

void BaseSemanticSegmentation::initModelImageSize() {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors.");
  }
  modelInputShape_ = inputShapes[0];
  if (modelInputShape_.size() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            "Unexpected model input size, expected at least 2 "
                            "dimensions but got: " +
                                std::to_string(modelInputShape_.size()) + ".");
  }
  numModelPixels = modelInputSize().area();
}

semantic_segmentation::SegmentationResult
BaseSemanticSegmentation::runInference(
    cv::Mat image, cv::Size originalSize,
    std::set<std::string, std::less<>> &classesOfInterest, bool resize) {
  std::scoped_lock lock(inference_mutex_);

  cv::Mat preprocessed = VisionModel::preprocess(image);
  auto inputTensor =
      (normMean_ && normStd_)
          ? image_processing::getTensorFromMatrix(
                modelInputShape_, preprocessed, *normMean_, *normStd_)
          : image_processing::getTensorFromMatrix(modelInputShape_,
                                                  preprocessed);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return computeResult(forwardResult->at(0).toTensor(), originalSize,
                       allClasses_, classesOfInterest, resize);
}

semantic_segmentation::SegmentationResult
BaseSemanticSegmentation::generateFromString(
    std::string imageSource,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  cv::Mat imageBGR = image_processing::readImage(imageSource);
  cv::Size originalSize = imageBGR.size();
  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);

  return runInference(imageRGB, originalSize, classesOfInterest, resize);
}

semantic_segmentation::SegmentationResult
BaseSemanticSegmentation::generateFromPixels(
    JSTensorViewIn pixelData,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  cv::Mat image = extractFromPixels(pixelData);
  return runInference(image, image.size(), classesOfInterest, resize);
}

semantic_segmentation::SegmentationResult
BaseSemanticSegmentation::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &frameData,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  auto orient = ::rnexecutorch::utils::readFrameOrientation(runtime, frameData);
  cv::Mat frame = extractFromFrame(runtime, frameData);
  cv::Mat rotated = utils::rotateFrameForModel(frame, orient);
  // Always run inference without resize — rotate first, then resize.
  auto result = runInference(rotated, rotated.size(), classesOfInterest, false);

  const cv::Size outputSize = modelInputSize();
  // JS reads maskW=frame.height, maskH=frame.width (sensor-native swap).
  const cv::Size frameSize = frame.size();

  auto inverseAndResize = [&orient, &frameSize, &outputSize,
                           resize](std::shared_ptr<OwningArrayBuffer> &buf,
                                   int32_t cvType, int32_t interpFlag) {
    cv::Mat m(outputSize, cvType, buf->data());
    cv::Mat inv = utils::inverseRotateMat(m, orient);
    if (resize && inv.size() != frameSize) {
      cv::resize(inv, inv, frameSize, 0, 0, interpFlag);
    }
    buf = std::make_shared<OwningArrayBuffer>(
        inv.data, static_cast<size_t>(inv.total() * inv.elemSize()));
  };

  if (outputSize.area() > 0) {
    if (result.argmax) {
      inverseAndResize(result.argmax, CV_32SC1, cv::INTER_NEAREST);
    }
    if (result.classBuffers) {
      for (auto &[label, buf] : *result.classBuffers) {
        inverseAndResize(buf, CV_32FC1, cv::INTER_LINEAR);
      }
    }
  }

  return result;
}

semantic_segmentation::SegmentationResult
BaseSemanticSegmentation::computeResult(
    const Tensor &tensor, cv::Size originalSize,
    std::vector<std::string> &allClasses,
    std::set<std::string, std::less<>> &classesOfInterest, bool resize) {

  const auto *dataPtr = tensor.const_data_ptr<float>();
  auto resultData = std::span(dataPtr, tensor.numel());

  // Read output dimensions directly from tensor shape
  std::size_t numChannels =
      (tensor.dim() >= 3) ? tensor.size(tensor.dim() - 3) : 1;
  std::size_t outputH = tensor.size(tensor.dim() - 2);
  std::size_t outputW = tensor.size(tensor.dim() - 1);
  std::size_t outputPixels = outputH * outputW;
  cv::Size outputSize(outputW, outputH);

  // Copy class data directly into OwningArrayBuffers (single copy from span)
  std::vector<std::shared_ptr<OwningArrayBuffer>> resultClasses;
  resultClasses.reserve(numChannels);

  if (numChannels == 1) {
    // Binary segmentation (e.g. selfie segmentation)
    auto fg = std::make_shared<OwningArrayBuffer>(resultData.data(),
                                                  outputPixels * sizeof(float));
    auto bg = std::make_shared<OwningArrayBuffer>(outputPixels * sizeof(float));
    auto *fgPtr = reinterpret_cast<float *>(fg->data());
    auto *bgPtr = reinterpret_cast<float *>(bg->data());
    for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
      bgPtr[pixel] = 1.0f - fgPtr[pixel];
    }
    resultClasses.push_back(fg);
    resultClasses.push_back(bg);
  } else {
    // Multi-class segmentation (e.g. DeepLab, RF-DETR)
    for (std::size_t cl = 0; cl < numChannels; ++cl) {
      resultClasses.push_back(std::make_shared<OwningArrayBuffer>(
          resultData.data() + cl * outputPixels, outputPixels * sizeof(float)));
    }
  }

  // Softmax + argmax in class-major order
  auto argmax =
      std::make_shared<OwningArrayBuffer>(outputPixels * sizeof(int32_t));
  auto *argmaxPtr = reinterpret_cast<int32_t *>(argmax->data());

  if (numChannels == 1) {
    auto *fgPtr = reinterpret_cast<float *>(resultClasses[0]->data());
    for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
      argmaxPtr[pixel] = (fgPtr[pixel] > 0.5f) ? 0 : 1;
    }
  } else {
    std::vector<float> maxLogits(outputPixels,
                                 -std::numeric_limits<float>::infinity());
    std::vector<float> sumExp(outputPixels, 0.0f);

    // Pass 1: find per-pixel max and argmax
    for (std::size_t cl = 0; cl < numChannels; ++cl) {
      auto *clPtr = reinterpret_cast<float *>(resultClasses[cl]->data());
      for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
        if (clPtr[pixel] > maxLogits[pixel]) {
          maxLogits[pixel] = clPtr[pixel];
          argmaxPtr[pixel] = static_cast<int32_t>(cl);
        }
      }
    }

    // Pass 2: subtract max, exp, accumulate sum
    for (std::size_t cl = 0; cl < numChannels; ++cl) {
      auto *clPtr = reinterpret_cast<float *>(resultClasses[cl]->data());
      for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
        clPtr[pixel] = std::exp(clPtr[pixel] - maxLogits[pixel]);
        sumExp[pixel] += clPtr[pixel];
      }
    }

    // Pass 3: normalize by sum
    for (std::size_t cl = 0; cl < numChannels; ++cl) {
      auto *clPtr = reinterpret_cast<float *>(resultClasses[cl]->data());
      for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
        clPtr[pixel] /= sumExp[pixel];
      }
    }
  }

  auto buffersToReturn = std::make_shared<
      std::unordered_map<std::string, std::shared_ptr<OwningArrayBuffer>>>();
  bool returnAllClasses = classesOfInterest.empty();
  for (std::size_t cl = 0; cl < resultClasses.size(); ++cl) {
    if (cl < allClasses.size() &&
        (returnAllClasses || classesOfInterest.contains(allClasses[cl]))) {
      (*buffersToReturn)[allClasses[cl]] = resultClasses[cl];
    }
  }

  // Resize selected classes and argmax
  if (resize) {
    cv::Mat argmaxMat(outputSize, CV_32SC1, argmax->data());
    cv::resize(argmaxMat, argmaxMat, originalSize, 0, 0,
               cv::InterpolationFlags::INTER_NEAREST);
    argmax = std::make_shared<OwningArrayBuffer>(
        argmaxMat.data, originalSize.area() * sizeof(int32_t));

    for (auto &[label, arrayBuffer] : *buffersToReturn) {
      cv::Mat classMat(outputSize, CV_32FC1, arrayBuffer->data());
      cv::resize(classMat, classMat, originalSize);
      arrayBuffer = std::make_shared<OwningArrayBuffer>(
          classMat.data, originalSize.area() * sizeof(float));
    }
  }

  return semantic_segmentation::SegmentationResult{argmax, buffersToReturn};
}

} // namespace rnexecutorch::models::semantic_segmentation
