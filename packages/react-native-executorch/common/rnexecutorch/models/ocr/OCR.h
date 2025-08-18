#pragma once

#include <rnexecutorch/models/ocr/Detector.h>
#include <rnexecutorch/models/ocr/RecognitionHandler.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <string>
#include <vector>

namespace rnexecutorch {
/*
 The OCR consists of two phases:
 1. Detection - detecting text regions in the image, the result of this phase
 is a list of bounding boxes.
 2. Recognition - recognizing the text in the bounding boxes, the result is a
 list of strings and corresponding boxes & confidence scores.

 Recognition uses three models, each model is resposible for recognizing text
 of different sizes (e.g. large - 512x64, medium - 256x64, small - 128x64).
*/

class OCR final {
public:
  explicit OCR(const std::string &detectorSource,
               const std::string &recognizerSourceLarge,
               const std::string &recognizerSourceMedium,
               const std::string &recognizerSourceSmall, std::string symbols,
               std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<OCRDetection> generate(std::string input);
  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  Detector detector;
  RecognitionHandler recognitionHandler;
};
} // namespace rnexecutorch
