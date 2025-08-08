#pragma once

#include <rnexecutorch/models/ocr/Detector.h>
#include <rnexecutorch/models/ocr/RecognitionHandler.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <string>
#include <vector>

namespace rnexecutorch {
class OCR final {
public:
  explicit OCR(const std::string &detectorSource,
               const std::string &recognizerSourceLarge,
               const std::string &recognizerSourceMedium,
               const std::string &recognizerSourceSmall, std::string symbols,
               std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<OCRDetection> generate(std::string input);
  std::size_t getMemoryLowerBound() const noexcept;

private:
  Detector detector;
  RecognitionHandler recognitionHandler;
};
} // namespace rnexecutorch
