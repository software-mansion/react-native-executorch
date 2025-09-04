#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_image {

class Decoder : public BaseModel {
public:
  Decoder(const std::string &modelSource,
        int modelImageSize, int numChannels,
        std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<float> generate(const std::vector<float> & input);

private:
  int modelImageSize;
  int numChannels;
};
} // namespace models::text_to_image

REGISTER_CONSTRUCTOR(models::text_to_image::Decoder, std::string, int, int,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
