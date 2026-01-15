#pragma once

#include <cstdint>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch::models::ocr {

/*
 Vertical Detector is an sligtly modified Detector tuned for detecting Vertical
 text. For more details about standard detector, refer to the file
 ocr/Detector.cpp.

  In Vertical OCR pipeline we make use of Detector two times:

  1. Large Detector through forward_1280 method -- The differences between
 Detector used in standard OCR and Large Detector used in Vertical OCR is: a) To
 obtain detected boxes from heeat maps it utilizes
 `getDetBoxesFromTextMapVertical()` function rather than
 'getDetBoxesFromTextMap()`. Other than that, refer to the standard OCR
 Detector.

  2. Narrow Detector through forward_320 method -- it is designed to detect a
 single characters bounding boxes. `getDetBoxesFromTextMapVertical()` function
 acts differently for Narrow Detector and different textThreshold Value is
 passed. Additionally, the grouping of detected boxes is completely omited.

  Vertical Detector pipeline differentiate the Large Detector and Narrow
 Detector based on `detectSingleCharacters` flag passed to the constructor.
*/

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class VerticalDetector final : public BaseModel {
public:
  explicit VerticalDetector(const std::string &modelSource,
                            std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<types::DetectorBBox> generate(const cv::Mat &inputImage,
                                            int32_t inputWidth,
                                            bool detectSingleCharacters);

  cv::Size getModelImageSize(int inputWidth) const noexcept;

private:
  std::vector<types::DetectorBBox>
  postprocess(const Tensor &tensor, const cv::Size &modelInputSize,
              bool detectSingleCharacters) const;
  cv::Size calculateImageSizeForWidth(const int methoInputWidth);

  cv::Size modelSmallImageSize;
  cv::Size modelMediumImageSize;
  cv::Size modelLargeImageSize;
};
} // namespace rnexecutorch::models::ocr
