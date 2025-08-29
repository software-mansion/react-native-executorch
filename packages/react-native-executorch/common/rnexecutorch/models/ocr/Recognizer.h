#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/BaseModel.h>
#include <string>
#include <utility>
#include <vector>

namespace rnexecutorch::models::ocr {
/*
 Recognizer is a model responsible for interpreting detected text regions
 into characters/words.

 The model used as Recognizer is based on CRNN paper.
 https://arxiv.org/pdf/1507.05717

 It returns the list of predicted indices and a confidence value.
*/

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class Recognizer final : public BaseModel {
public:
  explicit Recognizer(const std::string &modelSource,
                      std::shared_ptr<react::CallInvoker> callInvoker);
  std::pair<std::vector<int32_t>, float> generate(const cv::Mat &grayImage);

private:
  std::pair<std::vector<int32_t>, float>
  postprocess(const Tensor &tensor) const;

  cv::Size modelImageSize;
};
} // namespace rnexecutorch::models::ocr
