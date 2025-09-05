#pragma once

#include <memory>
#include <set>
#include <string>
#include <utility>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <rnexecutorch/models/text_to_image/Constants.h>
#include <rnexecutorch/models/text_to_image/Decoder.h>
#include <rnexecutorch/models/text_to_image/Scheduler.h>
#include <rnexecutorch/models/text_to_image/UNet.h>

namespace rnexecutorch {
namespace models::text_to_image {
using namespace facebook;

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class TextToImage {
public:
  TextToImage(const std::string &tokenizerSource,
              const std::string &schedulerSource,
              const std::string &encoderSource, const std::string &unetSource,
              const std::string &decoderSource, int imageSize,
              std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<OwningArrayBuffer> generate(std::string input,
                                              int numInferenceSteps);
  size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  std::shared_ptr<OwningArrayBuffer>
  postprocess(const std::vector<float> &output);
  size_t memorySizeLowerBound;

  int modelImageSize;
  int numChannels = 4;
  float guidanceScale = 7.5;
  float latentsScale = 0.18215;

  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<Scheduler> scheduler;
  std::unique_ptr<embeddings::TextEmbeddings> encoder;
  std::unique_ptr<UNet> unet;
  std::unique_ptr<Decoder> decoder;
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::TextToImage, std::string,
                     std::string, std::string, std::string, std::string, int,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch