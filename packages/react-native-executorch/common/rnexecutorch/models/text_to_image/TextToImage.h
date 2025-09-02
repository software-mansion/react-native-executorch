#pragma once

#include <set>
#include <utility>
#include <memory>
#include <string>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/text_to_image/Constants.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <ReactCommon/CallInvoker.h>

namespace rnexecutorch {
namespace models::text_to_image {
using namespace facebook;

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class TextToImage {
public:
  TextToImage(
    const std::string &tokenizerSource,
    const std::string &schedulerSource,
    const std::string &encoderSource,
    const std::string &transformerSource,
    const std::string &decoderSource,
    int imageSize,
    std::shared_ptr<react::CallInvoker> callInvoker);
  void generate(std::string input, int numSteps);
  size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

protected:
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<embeddings::TextEmbeddings> encoder;
  std::unique_ptr<BaseModel> transformer;
  std::unique_ptr<BaseModel> decoder;

private:
  int modelImageSize;
  size_t memorySizeLowerBound;

  float guidanceScale = 7.5;
  int batchSize = 1;
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::TextToImage,
                     std::string, std::string, std::string, std::string, std::string, int,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch