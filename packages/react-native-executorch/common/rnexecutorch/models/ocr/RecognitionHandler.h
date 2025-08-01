#pragma once

#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/ocr/CTCLabelConverter.h>
#include <rnexecutorch/models/ocr/Recognizer.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <string>
#include <vector>

namespace rnexecutorch {

class RecognitionHandler final {
public:
  explicit RecognitionHandler(const std::string &recognizerSourceLarge,
                              const std::string &recognizerSourceMedium,
                              const std::string &recognizerSourceSmall,
                              std::string symbols,
                              std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<OCRDetection> recognize(std::vector<DetectorBBox> bboxesList,
                                      cv::Mat &imgGray, cv::Size desiredSize);
  void unload() noexcept;
  std::size_t getMemoryLowerBound() const noexcept;

private:
  std::pair<std::vector<int32_t>, float> runModel(cv::Mat image);
  std::size_t memorySizeLowerBound{0};
  ocr::CTCLabelConverter converter;
  Recognizer recognizerLarge;
  Recognizer recognizerMedium;
  Recognizer recognizerSmall;
};
} // namespace rnexecutorch
