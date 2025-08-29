#include "Classification.h"

#include <future>

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/classification/Constants.h>

namespace rnexecutorch::models::classification {

Classification::Classification(const std::string &modelSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.size() == 0) {
    throw std::runtime_error("Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimentions "
                  "but got: %zu.",
                  modelInputShape.size());
    throw std::runtime_error(errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::unordered_map<std::string_view, float>
Classification::generate(std::string imageSource) {
  auto inputTensor =
      image_processing::readImageToTensor(imageSource, getAllInputShapes()[0])
          .first;
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor());
}

std::unordered_map<std::string_view, float>
Classification::postprocess(const Tensor &tensor) {
  std::span<const float> resultData(
      static_cast<const float *>(tensor.const_data_ptr()), tensor.numel());
  std::vector<float> resultVec(resultData.begin(), resultData.end());

  if (resultVec.size() != constants::kImagenet1kV1Labels.size()) {
    char errorMessage[100];
    std::snprintf(
        errorMessage, sizeof(errorMessage),
        "Unexpected classification output size, was expecting: %zu classes "
        "but got: %zu classes",
        constants::kImagenet1kV1Labels.size(), resultVec.size());
    throw std::runtime_error(errorMessage);
  }

  numerical::softmax(resultVec);

  std::unordered_map<std::string_view, float> probs;
  for (std::size_t cl = 0; cl < resultVec.size(); ++cl) {
    probs[constants::kImagenet1kV1Labels[cl]] = resultVec[cl];
  }

  return probs;
}

} // namespace rnexecutorch::models::classification