#pragma once

#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/ocr/CTCLabelConverter.h>
#include <rnexecutorch/models/ocr/Recognizer.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <string>
#include <vector>

namespace rnexecutorch::models::ocr {
/*
 Recogntion Handler is responsible for:
 1. Preparing the image to be processed by Recognition Model.
 2. Deciding which Recogntion Model is used for each detected bounding box.
 3. Returning the list of tuples (box, text, confidence) to the OCR class.
*/

class RecognitionHandler final {
public:
  explicit RecognitionHandler(const std::string &recognizerSourceLarge,
                              const std::string &recognizerSourceMedium,
                              const std::string &recognizerSourceSmall,
                              std::string symbols,
                              std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<types::OCRDetection>
  recognize(std::vector<types::DetectorBBox> bboxesList, cv::Mat &imgGray,
            cv::Size desiredSize);
  void unload() noexcept;
  std::size_t getMemoryLowerBound() const noexcept;

private:
  std::pair<std::vector<int32_t>, float> runModel(cv::Mat image);
  void processBBox(std::vector<types::OCRDetection> &boxList,
                   types::DetectorBBox &box, cv::Mat &imgGray,
                   types::PaddingInfo ratioAndPadding);
  std::size_t memorySizeLowerBound{0};
  CTCLabelConverter converter;
  Recognizer recognizerLarge;
  Recognizer recognizerMedium;
  Recognizer recognizerSmall;
};
} // namespace rnexecutorch::models::ocr
