#pragma once

#include <unordered_map>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class Classification : public BaseModel {
public:
  Classification(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);
  std::unordered_map<std::string_view, float> generate(std::string imageSource);

private:
  std::unordered_map<std::string_view, float> postprocess(const Tensor &tensor);

  cv::Size modelImageSize{0, 0};
};

} // namespace rnexecutorch