#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_image {

class UNet : public BaseModel {
public:
  UNet(const std::string &modelSource,
        int modelImageSize, int numChannels,
        std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<float> generate(const std::vector<float> & latents,
                              int timestep, const std::vector<float> & embeddings);

private:
  int modelImageSize;
  int numChannels;
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::UNet, std::string, int, int,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
