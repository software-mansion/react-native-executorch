#pragma once

#include <string>
#include <vector>

#include <rnexecutorch/models/ocr/Detector.h>
#include <rnexecutorch/models/ocr/RecognitionHandler.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch {
class OCR {
public:
  OCR(std::string detectorSource, std::string recognizerSourceLarge,
      std::string recognizerSourceMedium, std::string recognizerSourceSmall,
      std::string symbols, std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<OCRDetection> forward(std::string input);
  void unloadModule();
  std::size_t getMemoryLowerBound();

private:
  RecognitionHandler recognitionHandler;
  Detector detector;
};
} // namespace rnexecutorch