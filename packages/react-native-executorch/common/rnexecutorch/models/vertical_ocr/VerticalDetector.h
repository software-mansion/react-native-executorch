#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class VerticalDetector final : public BaseModel {
public:
  explicit VerticalDetector(const std::string &modelSource,
                            bool detectSingleCharacters,
                            std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<DetectorBBox> generate(const cv::Mat &inputImage);
  cv::Size getModelImageSize() const noexcept;

private:
  bool detectSingleCharacters;
  std::vector<DetectorBBox> postprocess(const Tensor &tensor) const noexcept;
  cv::Size modelImageSize;
};
} // namespace rnexecutorch
