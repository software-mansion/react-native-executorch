#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class VerticalDetector : public BaseModel {
public:
  VerticalDetector(const std::string &modelSource, bool detectSingleCharacters,
                   std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<DetectorBBox> generate(const cv::Mat &inputImage);
  cv::Size getModelImageSize();

private:
  cv::Size modelSize;
  bool detectSingleCharacters;
  std::vector<DetectorBBox> postprocess(const Tensor &tensor);
  cv::Size modelImageSize;
};
} // namespace rnexecutorch
