#include "VoiceActivityDetection.h"
#include "rnexecutorch/models/voice_activity_detection/Constants.h"
#include "rnexecutorch/models/voice_activity_detection/Utils.h"

#include <algorithm>
#include <array>
#include <functional>
#include <numeric>
#include <ranges>
#include <vector>

namespace rnexecutorch::models::voice_activity_detection {
using namespace constants;
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

VoiceActivityDetection::VoiceActivityDetection(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

std::vector<types::Segment>
VoiceActivityDetection::generate(std::span<float> waveform) const {
  auto stridedInput = preprocess(waveform);
}

std::vector<std::array<float, kPaddedWindowSize>>
VoiceActivityDetection::preprocess(std::span<float> waveform) const {
  // change to auto if possible lol
  std::array<float, kWindowSize> kHammingWindowArray =
      utils::generateHammingWindow();

  const size_t numFrames = (waveform.size() - kWindowSize) / kHopLength;

  std::vector<std::array<float, kPaddedWindowSize>> frameBuffer(
      numFrames, std::array<float, kPaddedWindowSize>{});

  constexpr size_t totalPadding = kPaddedWindowSize - kWindowSize;
  constexpr size_t leftPadding = totalPadding / 2;
  for (size_t i = 0; i < numFrames; i++) {

    auto windowView = waveform.subspan(i, kWindowSize);
    std::ranges::copy(windowView, frameBuffer[i].begin() + leftPadding);

    std::ranges::transform(
        frameBuffer[i] | std::views::drop(leftPadding), kHammingWindowArray,
        frameBuffer[i].begin() + leftPadding, std::multiplies{});
  }
  return frameBuffer;
}

std::vector<types::Segment>
VoiceActivityDetection::generate(std::span<float> waveform) const {

  auto windowedInput = preprocess(waveform);
  auto [chunksNumber, remainder] = std::div(
      static_cast<int>(windowedInput.size()), static_cast<int>(kModelInputMax));
  auto lastChunkSize = remainder;
  if (remainder < kModelInputMin) {
    auto paddingSize = kModelInputMin - remainder;
    lastChunkSize = kModelInputMin;
    windowedInput.insert(windowedInput.end(), paddingSize,
                         std::array<float, kPaddedWindowSize>{});
  }
  TensorPtr inputTensor;
  size_t startIdx = 0;
  std::span<std::array<float, kPaddedWindowSize>> chunk;
  std::vector<float> scores(waveform.size());

  for (size_t i = 0; i < chunksNumber - 1; i += 1) {
    std::span<std::array<float, kPaddedWindowSize>> chunk(
        windowedInput.data() + kModelInputMax * i, kModelInputMax);
    inputTensor = executorch::extension::from_blob(
        chunk.data(), {kModelInputMax, kPaddedWindowSize},
        executorch::aten::ScalarType::Float);
    auto forwardResult = BaseModel::forward(inputTensor);
    if (!forwardResult.ok()) {
      throw std::runtime_error(
          "Failed to forward, error: " +
          std::to_string(static_cast<uint32_t>(forwardResult.error())));
    }
    auto tensor = forwardResult->at(0).toTensor();
    startIdx = utils::getNonSpeechClassProbabilites(
        tensor, tensor.size(2), tensor.size(1), scores, startIdx);
  }

  std::span<std::array<float, kPaddedWindowSize>> chunk(
      windowedInput.data() + kModelInputMax * chunksNumber, lastChunkSize);
  inputTensor = executorch::extension::from_blob(
      chunk.data(), {kModelInputMax, kPaddedWindowSize},
      executorch::aten::ScalarType::Float);
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }
  auto tensor = forwardResult->at(0).toTensor();
  startIdx = utils::getNonSpeechClassProbabilites(tensor, tensor.size(2),
                                                  remainder, scores, startIdx);

  return postprocess(scores, kSpeechThreshold);
}

std::vector<types::Segment>
VoiceActivityDetection::postprocess(const std::vector<float> &scores,
                                    const float threshold) const {
  // SCORES = [1 - SCORES]
  bool triggered = false;
  std::vector<types::Segment> speechSegments{};
  ssize_t startSegment = -1;
  ssize_t endSegment = -1;
  ssize_t potentialStart = -1;
  ssize_t potentialEnd = -1;
  float score;
  for (size_t i = 0; i < scores.size(); i++) {
    score = 1 - scores[i];
    if (!triggered) {
      if (score >= threshold) {
        if (potentialStart == -1) {
          potentialStart = i;
        } else if (i - potentialStart >= kMinSpeechDuration) {
          triggered = true;
          startSegment = potentialStart;
          potentialStart = -1;
        }
      } else { // score < threshold
        potentialStart = -1;
      }
    } else { // triggered
      if (score >= threshold) {
        if (potentialEnd == -1) {
          potentialEnd = i;
        } else if (i - potentialEnd >= kMinSilenceDuration) {
          triggered = false;
          endSegment = potentialEnd;
          speechSegments.emplace_back(startSegment, endSegment);
          potentialEnd = -1;
        }
      } else {
        potentialEnd = -1;
      }
    }
  }

  for (auto &[start, end] : speechSegments) {
    start = std::max(start - kSpeechPad, 0UL) * kHopLength;
    end = std::min(end + kSpeechPad, scores.size()) * kHopLength;
  }
  return speechSegments;
}

} // namespace rnexecutorch::models::voice_activity_detection