#pragma once

#include <memory>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_image {

class UNet final : public BaseModel {
public:
  explicit UNet(const std::string &modelSource,
                std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<float> generate(std::vector<float> &latents, int32_t timestep,
                              std::vector<float> &embeddings) const;

  int32_t latentImageSize;

private:
  static constexpr int32_t numChannels = 4;
};
} // namespace rnexecutorch::models::text_to_image
