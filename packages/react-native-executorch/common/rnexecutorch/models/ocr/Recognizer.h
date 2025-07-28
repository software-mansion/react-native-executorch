#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class Recognizer final : public BaseModel {
public:
  explicit Recognizer(const std::string &modelSource,
             std::shared_ptr<react::CallInvoker> callInvoker);
  std::pair<std::vector<int32_t>, float> generate(const cv::Mat &grayImage);

private:
  std::pair<std::vector<int32_t>, float> postprocess(const Tensor &tensor);

  cv::Size modelImageSize;
};
} // namespace rnexecutorch
