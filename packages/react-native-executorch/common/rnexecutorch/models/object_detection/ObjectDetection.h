#pragma once

#include <unordered_map>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/object_detection/Utils.h>

namespace rnexecutorch {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

class ObjectDetection : public BaseModel {
public:
  ObjectDetection(const std::string &modelSource,
                  std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<Detection> forward(std::string imageSource,
                                 double detectionThreshold);

private:
  std::pair<TensorPtr, cv::Size> preprocess(const std::string &imageSource);
  std::vector<Detection> postprocess(const std::vector<EValue> &tensors,
                                     cv::Size originalSize,
                                     double detectionThreshold);

  cv::Size modelImageSize{0, 0};
};

} // namespace rnexecutorch