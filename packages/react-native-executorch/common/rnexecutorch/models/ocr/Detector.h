#pragma once

#include <cstdint>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch::models::ocr {
/*
 Detector is a model responsible for recognizing the areas where text is
 located. It returns the list of bounding boxes. The model used as detector is
 based on CRAFT (Character Region Awareness for Text Detection) paper.
 https://arxiv.org/pdf/1904.01941
*/

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class Detector : public BaseModel {
public:
  explicit Detector(const std::string &modelSource,
                    std::shared_ptr<react::CallInvoker> callInvoker);
  [[nodiscard("Registered non-void function")]] 
  virtual std::vector<types::DetectorBBox> 
  generate(const cv::Mat &inputImage, int32_t inputWidth);

  cv::Size calculateModelImageSize(int32_t methodInputWidth);

protected:
  TensorPtr runInference(const cv::Mat &inputImage, int32_t inputWidth,
                         const std::string &detectorName);

  std::vector<types::DetectorBBox> postprocess(const Tensor &tensor,
                                               const cv::Size &modelInputSize);
};
} // namespace rnexecutorch::models::ocr
