#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/ocr/CTCLabelConverter.h>
#include <rnexecutorch/models/ocr/DetectorUtils.h>
#include <rnexecutorch/models/ocr/RecognitionHandlerUtils.h>
#include <rnexecutorch/models/ocr/Recognizer.h>
#include <rnexecutorch/models/ocr/RecognizerUtils.h>
#include <rnexecutorch/models/vertical_ocr/VerticalDetector.h>
#include <string>
#include <utility>
#include <vector>

namespace rnexecutorch {

/*
  Vertical OCR is OCR designed to handle vertical texts.
  Vertical OCR pipeline consists of:
  1. Large Detector -- detects regions where text is located.
     Almost identical to the Detector in standard OCR.
     The result of this phase is a list of bounding boxes.
  Each detected box is then processed individually through the following steps:
    2. Narrow Detector -- designed for detecting where single characters
       are located.
    There are two different strategies used for vertical recognition:
      Strategy 1 "Independent Characters":
        Treating each character region found  by Narrow Detector
        as compeletely independent.
        3. Each character is forwarded to Small Recognizer (64 x 64).
      Strategy 2 "Joint Characters":
        The bounding boxes found by Narrow Detector are
        horizontally merged to create one wide image.
        3. One wide image is forwarded to Large Recognzer (512 x 64).
    Vertical OCR differentiate between those two strategies based on
    `independentChars` flag passed to the constructor.
*/

using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class VerticalOCR final {
public:
  explicit VerticalOCR(const std::string &detectorLargeSource,
                       const std::string &detectorNarrowSource,
                       const std::string &recognizerSource, std::string symbols,
                       bool indpendentCharacters,
                       std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<OCRDetection> generate(std::string input);
  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  std::pair<std::string, float> _handleIndependentCharacters(
      const ocr::DetectorBBox &box, const cv::Mat &originalImage,
      const std::vector<ocr::DetectorBBox> &characterBoxes,
      const ocr::PaddingInfo &paddingsBox,
      const ocr::PaddingInfo &imagePaddings);
  std::pair<std::string, float>
  _handleJointCharacters(const ocr::DetectorBBox &box,
                         const cv::Mat &originalImage,
                         const std::vector<ocr::DetectorBBox> &characterBoxes,
                         const ocr::PaddingInfo &paddingsBox,
                         const ocr::PaddingInfo &imagePaddings);
  OCRDetection _processSingleTextBox(ocr::DetectorBBox &box,
                                     const cv::Mat &originalImage,
                                     const cv::Mat &resizedLargeImage,
                                     const ocr::PaddingInfo &imagePaddings);
  VerticalDetector detectorLarge;
  VerticalDetector detectorNarrow;
  Recognizer recognizer;
  ocr::CTCLabelConverter converter;
  bool independentCharacters;
  std::shared_ptr<react::CallInvoker> callInvoker;
};

} // namespace rnexecutorch
