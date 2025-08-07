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
      const DetectorBBox &box, const cv::Mat &originalImage,
      const std::vector<DetectorBBox> &characterBoxes,
      const PaddingInfo &paddingsBox, const PaddingInfo &imagePaddings);
  std::pair<std::string, float>
  _handleJointCharacters(const DetectorBBox &box, const cv::Mat &originalImage,
                         const std::vector<DetectorBBox> &characterBoxes,
                         const PaddingInfo &paddingsBox,
                         const PaddingInfo &imagePaddings);
  OCRDetection _processSingleTextBox(DetectorBBox &box,
                                     const cv::Mat &originalImage,
                                     const cv::Mat &resizedLargeImage,
                                     const PaddingInfo &imagePaddings);
  VerticalDetector detectorLarge;
  VerticalDetector detectorNarrow;
  Recognizer recognizer;
  ocr::CTCLabelConverter converter;
  bool independentCharacters;
  std::shared_ptr<react::CallInvoker> callInvoker;
};

} // namespace rnexecutorch
