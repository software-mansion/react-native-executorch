#pragma once

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Detector.h>
#include <rnexecutorch/models/ocr/RecognitionHandler.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <string>
#include <vector>

namespace rnexecutorch {
class OCR {
public:
  OCR(std::string detectorSource, std::string recognizerSourceLarge,
      std::string recognizerSourceMedium, std::string recognizerSourceSmall,
      std::string symbols, std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<OCRDetection> generate(std::string input);
  std::size_t getMemoryLowerBound();

private:
  Detector detector;
  RecognitionHandler recognitionHandler;
};
} // namespace rnexecutorch