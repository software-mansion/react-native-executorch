#include "ImageEmbeddings.h"

#include <span>

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch::models::embeddings {

ImageEmbeddings::ImageEmbeddings(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();
  if (inputTensors.size() == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors.");
  }
  inputTensorDims_ = inputTensors[0];
  if (inputTensorDims_.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimensions "
                  "but got: %zu.",
                  inputTensorDims_.size());
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            errorMessage);
  }
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::runInference(cv::Mat image) {
  std::scoped_lock lock(inference_mutex_);

  cv::Mat preprocessed = preprocessFrame(image);

  auto inputTensor =
      image_processing::getTensorFromMatrix(inputTensorDims_, preprocessed);

  auto forwardResult = BaseModel::forward(inputTensor);

  if (!forwardResult.ok()) {
    throw RnExecutorchError(
        forwardResult.error(),
        "The model's forward function did not succeed. Ensure the model input "
        "is correct.");
  }

  auto forwardResultTensor = forwardResult->at(0).toTensor();
  return std::make_shared<OwningArrayBuffer>(
      forwardResultTensor.const_data_ptr(), forwardResultTensor.nbytes());
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::generateFromString(std::string imageSource) {
  cv::Mat imageBGR = image_processing::readImage(imageSource);

  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);

  return runInference(imageRGB);
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::generateFromFrame(jsi::Runtime &runtime,
                                   const jsi::Value &frameData) {
  cv::Mat frame = extractFromFrame(runtime, frameData);
  return runInference(frame);
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::generateFromPixels(JSTensorViewIn pixelData) {
  cv::Mat image = extractFromPixels(pixelData);

  return runInference(image);
}

} // namespace rnexecutorch::models::embeddings
