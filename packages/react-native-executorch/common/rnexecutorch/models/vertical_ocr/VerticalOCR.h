#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <string>
#include <utility>
#include <vector>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/CTCLabelConverter.h>
#include <rnexecutorch/models/ocr/Recognizer.h>
#include <rnexecutorch/models/ocr/utils/DetectorUtils.h>
#include <rnexecutorch/models/ocr/utils/RecognitionHandlerUtils.h>
#include <rnexecutorch/models/ocr/utils/RecognizerUtils.h>
#include <rnexecutorch/models/vertical_ocr/VerticalDetector.h>

namespace rnexecutorch {
namespace models::ocr {

/*
  Vertical OCR is OCR designed to handle vertical texts.
  Vertical OCR pipeline consists of:
  1. Detector using forward_1280 method-- detects regions where text is located.
     Almost identical to the Detector in standard OCR.
     The result of this phase is a list of bounding boxes.
  Each detected box is then processed individually through the following steps:
    2. Detector using forward_320 method -- designed for detecting where single
  characters are located. There are two different strategies used for vertical
  recognition: Strategy 1 "Independent Characters": Treating each character
  region found  by Narrow Detector as compeletely independent.
        3. Each character is forwarded to Recognizer with input size 64 x 64.
      Strategy 2 "Joint Characters":
        The bounding boxes found by Narrow Detector are
        horizontally merged to create one wide image.
        3. One wide image is forwarded to  Recognzer with input width of 512
  x 64. Vertical OCR differentiate between those two strategies based on
    `independentChars` flag passed to the constructor.
*/

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class VerticalOCR final {
public:
  explicit VerticalOCR(const std::string &detectorSource,
                       const std::string &recognizerSource, std::string symbols,
                       bool indpendentCharacters,
                       std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<types::OCRDetection> generate(std::string input);
  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  std::pair<std::string, float> _handleIndependentCharacters(
      const types::DetectorBBox &box, const cv::Mat &originalImage,
      const std::vector<types::DetectorBBox> &characterBoxes,
      const types::PaddingInfo &paddingsBox,
      const types::PaddingInfo &imagePaddings);

  std::pair<std::string, float>
  _handleJointCharacters(const types::DetectorBBox &box,
                         const cv::Mat &originalImage,
                         const std::vector<types::DetectorBBox> &characterBoxes,
                         const types::PaddingInfo &paddingsBox,
                         const types::PaddingInfo &imagePaddings);
  types::OCRDetection
  _processSingleTextBox(types::DetectorBBox &box, const cv::Mat &originalImage,
                        const cv::Mat &resizedLargeImage,
                        const types::PaddingInfo &imagePaddings);

  VerticalDetector detector;
  Recognizer recognizer;
  CTCLabelConverter converter;
  bool independentCharacters;
  std::shared_ptr<react::CallInvoker> callInvoker;
};
} // namespace models::ocr

REGISTER_CONSTRUCTOR(models::ocr::VerticalOCR, std::string, std::string,
                     std::string, bool, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
