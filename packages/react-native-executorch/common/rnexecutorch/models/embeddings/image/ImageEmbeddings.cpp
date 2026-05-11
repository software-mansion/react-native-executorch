#include "ImageEmbeddings.h"
#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch::models::embeddings {

ImageEmbeddings::ImageEmbeddings(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  modelInputShape_ = validateAndGetInputShape();
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::runInference(cv::Mat image) {
  std::scoped_lock lock(inference_mutex_);

  cv::Mat preprocessed = preprocess(image);
  auto inputTensor = createInputTensor(preprocessed);

  auto outputs = forwardOrThrow(
      inputTensor,
      "The model's forward function did not succeed. Ensure the model input "
      "is correct.");

  auto forwardResultTensor = outputs.at(0).toTensor();
  return std::make_shared<OwningArrayBuffer>(
      forwardResultTensor.const_data_ptr(), forwardResultTensor.nbytes());
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::generateFromString(std::string imageSource) {
  cv::Mat imageRGB = loadImageToRGB(imageSource);
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
