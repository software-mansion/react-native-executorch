#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class Detector : public BaseModel {
public:
  Detector(const std::string &modelSource,
           std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<DetectorBBox> generate(const std::string &imageSource);

private:
  std::vector<DetectorBBox> postprocess(const Tensor &tensor,
                                        cv::Size originalSize);

  cv::Size modelImageSize;
};
} // namespace rnexecutorch