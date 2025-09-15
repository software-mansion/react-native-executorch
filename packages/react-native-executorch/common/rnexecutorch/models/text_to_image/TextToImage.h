#pragma once

#include <memory>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

#include <rnexecutorch/models/text_to_image/Decoder.h>
#include <rnexecutorch/models/text_to_image/Encoder.h>
#include <rnexecutorch/models/text_to_image/Scheduler.h>
#include <rnexecutorch/models/text_to_image/UNet.h>

namespace rnexecutorch {
namespace models::text_to_image {
using namespace facebook;

class TextToImage final {
public:
  explicit TextToImage(const std::string &tokenizerSource,
                       const std::string &encoderSource,
                       const std::string &unetSource,
                       const std::string &decoderSource,
                       float schedulerBetaStart, float schedulerBetaEnd,
                       int32_t schedulerNumTrainTimesteps,
                       int32_t schedulerStepsOffset, int32_t imageSize,
                       std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<OwningArrayBuffer>
  generate(std::string input, size_t numInferenceSteps,
           std::shared_ptr<jsi::Function> callback);
  void interrupt() noexcept;
  size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  std::shared_ptr<OwningArrayBuffer>
  postprocess(const std::vector<float> &output) const;

  size_t memorySizeLowerBound;
  int32_t modelImageSize;
  static constexpr int32_t numChannels = 4;
  static constexpr float guidanceScale = 7.5f;
  static constexpr float latentsScale = 0.18215f;
  bool interrupted = false;

  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<Scheduler> scheduler;
  std::unique_ptr<Encoder> encoder;
  std::unique_ptr<UNet> unet;
  std::unique_ptr<Decoder> decoder;
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::TextToImage, std::string,
                     std::string, std::string, std::string, float, float,
                     int32_t, int32_t, int32_t,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
