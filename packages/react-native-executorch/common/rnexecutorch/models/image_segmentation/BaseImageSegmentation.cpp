#include "BaseImageSegmentation.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::image_segmentation {

BaseImageSegmentation::BaseImageSegmentation(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  initModelImageSize();
}

BaseImageSegmentation::BaseImageSegmentation(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  initModelImageSize();
  if (normMean.size() == 3) {
    normMean_ = cv::Scalar(normMean[0], normMean[1], normMean[2]);
  } else {
    log(LOG_LEVEL::Warn,
        "normMean must have 3 elements — ignoring provided value.");
  }
  if (normStd.size() == 3) {
    normStd_ = cv::Scalar(normStd[0], normStd[1], normStd[2]);
  } else {
    log(LOG_LEVEL::Warn,
        "normStd must have 3 elements — ignoring provided value.");
  }
}

void BaseImageSegmentation::initModelImageSize() {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            "Unexpected model input size, expected at least 2 "
                            "dimensions but got: " +
                                std::to_string(modelInputShape.size()) + ".");
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
  numModelPixels = modelImageSize.area();
}

cv::Mat BaseImageSegmentation::preprocessFrame(const cv::Mat &frame) const {
  cv::Mat rgb;

  if (frame.channels() == 4) {
#ifdef __APPLE__
    cv::cvtColor(frame, rgb, cv::COLOR_BGRA2RGB);
#else
    cv::cvtColor(frame, rgb, cv::COLOR_RGBA2RGB);
#endif
  } else if (frame.channels() == 3) {
    rgb = frame;
  } else {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unsupported frame format: %d channels", frame.channels());
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  cv::Mat processed;
  if (rgb.size() != modelImageSize) {
    cv::resize(rgb, processed, modelImageSize);
  } else {
    processed = rgb;
  }

  if (normMean_.has_value() && normStd_.has_value()) {
    processed.convertTo(processed, CV_32FC3, 1.0 / 255.0);
    processed -= *normMean_;
    processed /= *normStd_;
  }

  return processed;
}

TensorPtr
BaseImageSegmentation::preprocessFromString(const std::string &imageSource,
                                            cv::Size &originalSize) {
  auto [inputTensor, origSize] = image_processing::readImageToTensor(
      imageSource, getAllInputShapes()[0], false, normMean_, normStd_);
  originalSize = origSize;
  return inputTensor;
}

SegmentationResult BaseImageSegmentation::runInference(
    cv::Mat image, cv::Size originalSize, std::vector<std::string> allClasses,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  std::scoped_lock lock(inference_mutex_);

  cv::Mat preprocessed = preprocessFrame(image);

  const std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  auto inputTensor =
      image_processing::getTensorFromMatrix(tensorDims, preprocessed);

  auto forwardResult = BaseModel::forward(inputTensor);

  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize, allClasses,
                     classesOfInterest, resize);
}

SegmentationResult BaseImageSegmentation::generateFromString(
    std::string imageSource, std::vector<std::string> allClasses,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {

  cv::Size originalSize;
  auto inputTensor = preprocessFromString(imageSource, originalSize);

  auto forwardResult = BaseModel::forward(inputTensor);

  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize, allClasses,
                     classesOfInterest, resize);
}

SegmentationResult BaseImageSegmentation::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &frameData,
    std::vector<std::string> allClasses,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  // extractFromFrame rotates landscape frames 90° CW automatically.
  cv::Mat frame = extractFromFrame(runtime, frameData);
  cv::Size originalSize = frame.size();

  return runInference(frame, originalSize, std::move(allClasses),
                      std::move(classesOfInterest), resize);
}

SegmentationResult BaseImageSegmentation::generateFromPixels(
    JSTensorViewIn pixelData, std::vector<std::string> allClasses,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  cv::Mat image = extractFromPixels(pixelData);
  cv::Size originalSize = image.size();

  return runInference(image, originalSize, std::move(allClasses),
                      std::move(classesOfInterest), resize);
}

SegmentationResult BaseImageSegmentation::postprocess(
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

  // Filter classes of interest
  auto buffersToReturn = std::make_shared<
      std::unordered_map<std::string, std::shared_ptr<OwningArrayBuffer>>>();
  for (std::size_t cl = 0; cl < resultClasses.size(); ++cl) {
    if (cl < allClasses.size() && classesOfInterest.contains(allClasses[cl])) {
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

  return SegmentationResult{argmax, buffersToReturn};
}

} // namespace rnexecutorch::models::image_segmentation
