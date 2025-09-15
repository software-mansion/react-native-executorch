#pragma once

#include <memory>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>

#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_image {

class Decoder final : public BaseModel {
public:
  explicit Decoder(const std::string &modelSource, int32_t modelImageSize,
                   int32_t numChannels,
                   std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<float> generate(std::vector<float> &input) const;

private:
  int32_t modelImageSize;
  int32_t numChannels;
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::Decoder, std::string, int32_t,
                     int32_t, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
