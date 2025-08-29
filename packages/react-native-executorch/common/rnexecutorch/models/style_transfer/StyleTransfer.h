#pragma once

#include <string>
#include <utility>

#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::style_transfer {
using namespace facebook;
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class StyleTransfer : public BaseModel {
public:
  StyleTransfer(const std::string &modelSource,
                std::shared_ptr<react::CallInvoker> callInvoker);
  std::string generate(std::string imageSource);

private:
  std::string postprocess(const Tensor &tensor, cv::Size originalSize);

  cv::Size modelImageSize{0, 0};
};
} // namespace models::style_transfer

REGISTER_CONSTRUCTOR(models::style_transfer::StyleTransfer, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
