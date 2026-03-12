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

PixelDataResult StyleTransfer::postprocess(const Tensor &tensor,
                                           cv::Size outputSize) {
  // Convert tensor output (at model input size) to CV_8UC3 BGR mat
  cv::Mat mat = image_processing::getMatrixFromTensor(modelInputSize(), tensor);

  // Resize only if requested output differs from model output size
  if (mat.size() != outputSize) {
    cv::resize(mat, mat, outputSize);
  }

  // Convert BGR -> RGBA so JS can pass the buffer directly to Skia
  cv::Mat rgba;
  cv::cvtColor(mat, rgba, cv::COLOR_BGR2RGBA);

  std::size_t dataSize =
      static_cast<std::size_t>(outputSize.width) * outputSize.height * 4;
  auto pixelBuffer = std::make_shared<OwningArrayBuffer>(rgba.data, dataSize);
  log(LOG_LEVEL::Debug,
      "[StyleTransfer] postprocess: RGBA buffer size:", dataSize,
      "w:", outputSize.width, "h:", outputSize.height);

  return PixelDataResult{pixelBuffer, outputSize.width, outputSize.height};
}

PixelDataResult StyleTransfer::runInference(cv::Mat image,
                                            cv::Size originalSize) {
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

  return postprocess(forwardResult->at(0).toTensor(), originalSize);
}

PixelDataResult StyleTransfer::generateFromString(std::string imageSource) {
  cv::Mat imageBGR = image_processing::readImage(imageSource);
  cv::Size originalSize = imageBGR.size();

  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);

  return runInference(imageRGB, originalSize);
}

PixelDataResult StyleTransfer::generateFromFrame(jsi::Runtime &runtime,
                                                 const jsi::Value &frameData) {
  // extractFromFrame rotates landscape frames 90° CW automatically.
  cv::Mat frame = extractFromFrame(runtime, frameData);

  // For real-time frame processing, output at modelImageSize to avoid
  // allocating large buffers (e.g. 1280x720x3 ~2.7MB) on every frame.
  return runInference(frame, modelInputSize());
}

PixelDataResult StyleTransfer::generateFromPixels(JSTensorViewIn pixelData) {
  cv::Mat image = extractFromPixels(pixelData);
  cv::Size originalSize = image.size();

  return runInference(image, originalSize);
}

} // namespace rnexecutorch::models::style_transfer
