#pragma once

#include <unordered_map>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/VisionModel.h>

namespace rnexecutorch {
namespace models::classification {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class Classification : public VisionModel {
public:
  Classification(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);
  [[nodiscard("Registered non-void function")]] std::unordered_map<
      std::string_view, float>
  generate(std::string imageSource);
  [[nodiscard("Registered non-void function")]] std::unordered_map<
      std::string_view, float>
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &pixelData,
                    int width, int height);

protected:
  cv::Mat preprocessFrame(const cv::Mat &frame) const override;

private:
  std::unordered_map<std::string_view, float> postprocess(const Tensor &tensor);

  cv::Size modelImageSize{0, 0};
};
} // namespace models::classification

REGISTER_CONSTRUCTOR(models::classification::Classification, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch