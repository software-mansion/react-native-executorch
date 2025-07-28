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
#include <unordered_map>
#include <vector>

namespace rnexecutorch {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

class VerticalOCR final {
public:
  VerticalOCR(const std::string &detectorLargeSource,
              const std::string &detectorNarrowSource,
              const std::string &recognizerSource, const std::string symbols,
              const bool indpendentCharacters,
              std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<OCRDetection> generate(std::string input);
  std::size_t getMemoryLowerBound();

private:
  OCRDetection _processSingleTextBox(const DetectorBBox &box,
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
