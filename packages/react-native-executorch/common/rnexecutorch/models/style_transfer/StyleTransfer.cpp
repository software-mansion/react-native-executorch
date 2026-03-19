#include "StyleTransfer.h"

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/utils/FrameTransform.h>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

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
  return PixelDataResult{pixelBuffer, size.width, size.height, rgba.channels()};
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
  auto orient = extractFrameOrientation(runtime, frameData);
  cv::Mat frame = extractFromFrame(runtime, frameData);
  cv::Mat rotated = utils::rotateFrameForModel(frame, orient);
  cv::Mat output = runInference(rotated, modelInputSize());
  cv::Mat oriented = utils::inverseRotateMat(output, orient);
  return toPixelDataResult(oriented);
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
