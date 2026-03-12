#include "StyleTransfer.h"

#include <rnexecutorch/data_processing/ImageProcessing.h>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::style_transfer {
using namespace facebook;
using executorch::extension::TensorPtr;

StyleTransfer::StyleTransfer(const std::string &modelSource,
                             std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.size() == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors");
  }
  modelInputShape_ = inputShapes[0];
  if (modelInputShape_.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimensions "
                  "but got: %zu.",
                  modelInputShape_.size());
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            errorMessage);
  }
}

// Runs inference and returns the styled BGR cv::Mat resized to outputSize.
// Acquires inference_mutex_ for the duration.
cv::Mat StyleTransfer::runInference(cv::Mat image, cv::Size outputSize) {
  std::scoped_lock lock(inference_mutex_);

  cv::Mat preprocessed = preprocess(image);

  auto inputTensor =
      image_processing::getTensorFromMatrix(modelInputShape_, preprocessed);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  cv::Mat mat = image_processing::getMatrixFromTensor(
      modelInputSize(), forwardResult->at(0).toTensor());
  if (mat.size() != outputSize) {
    cv::resize(mat, mat, outputSize);
  }
  return mat;
}

PixelDataResult toPixelDataResult(const cv::Mat &bgrMat) {
  cv::Size size = bgrMat.size();
  // Convert BGR -> RGBA so JS can pass the buffer directly to Skia
  cv::Mat rgba;
  cv::cvtColor(bgrMat, rgba, cv::COLOR_BGR2RGBA);
  std::size_t dataSize = static_cast<std::size_t>(size.width) * size.height * 4;
  auto pixelBuffer = std::make_shared<OwningArrayBuffer>(rgba.data, dataSize);
  return PixelDataResult{pixelBuffer, size.width, size.height};
}

StyleTransferResult StyleTransfer::generateFromString(std::string imageSource,
                                                      bool saveToFile) {
  cv::Mat imageBGR = image_processing::readImage(imageSource);
  cv::Size originalSize = imageBGR.size();

  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);

  cv::Mat result = runInference(imageRGB, originalSize);
  if (saveToFile) {
    return image_processing::saveToTempFile(result);
  }
  return toPixelDataResult(result);
}

PixelDataResult StyleTransfer::generateFromFrame(jsi::Runtime &runtime,
                                                 const jsi::Value &frameData) {
  // extractFromFrame rotates landscape frames 90° CW automatically.
  cv::Mat frame = extractFromFrame(runtime, frameData);

  // For real-time frame processing, output at modelInputSize to avoid
  // allocating large buffers (e.g. 1280x720x3 ~2.7MB) on every frame.
  return toPixelDataResult(runInference(frame, modelInputSize()));
}

StyleTransferResult StyleTransfer::generateFromPixels(JSTensorViewIn pixelData,
                                                      bool saveToFile) {
  cv::Mat image = extractFromPixels(pixelData);

  cv::Mat result = runInference(image, image.size());
  if (saveToFile) {
    return image_processing::saveToTempFile(result);
  }
  return toPixelDataResult(result);
}

} // namespace rnexecutorch::models::style_transfer
