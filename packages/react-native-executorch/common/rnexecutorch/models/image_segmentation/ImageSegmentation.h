#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/image_segmentation/BaseImageSegmentation.h>

namespace rnexecutorch {
namespace models::image_segmentation {
using namespace facebook;

class ImageSegmentation : public BaseImageSegmentation {
public:
  using BaseImageSegmentation::BaseImageSegmentation;
};
} // namespace models::image_segmentation

REGISTER_CONSTRUCTOR(models::image_segmentation::ImageSegmentation, std::string,
                     std::vector<float>, std::vector<float>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
