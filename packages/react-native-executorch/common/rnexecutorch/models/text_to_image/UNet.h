#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_image {

class UNet : public BaseModel {
public:
  explicit UNet(const std::string &modelSource, int32_t modelImageSize,
       int32_t numChannels, std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<float> generate(std::vector<float> &latents, int32_t timestep,
                              std::vector<float> &embeddings) const;

private:
  int32_t modelImageSize;
  int32_t numChannels;
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::UNet, std::string, int32_t, int32_t,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
