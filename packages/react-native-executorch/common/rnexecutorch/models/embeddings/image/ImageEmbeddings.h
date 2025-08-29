#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/embeddings/BaseEmbeddings.h>

namespace rnexecutorch {
namespace models::embeddings {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class ImageEmbeddings final : public BaseEmbeddings {
public:
  ImageEmbeddings(const std::string &modelSource,
                  std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<OwningArrayBuffer> generate(std::string imageSource);

private:
  cv::Size modelImageSize{0, 0};
};
} // namespace models::embeddings

REGISTER_CONSTRUCTOR(models::embeddings::ImageEmbeddings, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
