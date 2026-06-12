#include "VoiceActivityDetection.h"
#include "rnexecutorch/data_processing/dsp.h"
#include "rnexecutorch/models/voice_activity_detection/Utils.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

#include <algorithm>
#include <array>
#include <functional>
#include <numeric>
#include <thread>
#include <vector>

namespace rnexecutorch::models::voice_activity_detection {

namespace ranges = std::ranges;
using namespace constants;
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

VoiceActivityDetection::VoiceActivityDetection(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), callInvoker_(callInvoker) {
  // Important - preallocate memory for the buffer to avoid any reallocations.
  audioBuffer_.reserve(2 * constants::kStreamBufferMaxSize);
}

std::vector<types::Segment>
VoiceActivityDetection::generate(std::span<float> waveform,
                                 uint32_t mergeGap) const {
  // Guard against small buffers to prevent underflow in preprocess
  if (waveform.size() < kWindowSize) {
    return {};
  }

  auto windowedInput = preprocess(waveform);
  auto [chunksNumber, remainder] = std::div(
      static_cast<int>(windowedInput.size()), static_cast<int>(kModelInputMax));
  std::vector<float> scores(windowedInput.size());
  auto lastChunkSize = remainder;
  if (remainder < kModelInputMin) {
    auto paddingSize = kModelInputMin - remainder;
    lastChunkSize = kModelInputMin;
    windowedInput.insert(windowedInput.end(), paddingSize,
                         std::array<float, kPaddedWindowSize>{});
  }
  TensorPtr inputTensor;
  size_t startIdx = 0;

  for (size_t i = 0; i < chunksNumber; i++) {
    std::span<std::array<float, kPaddedWindowSize>> chunk(
        windowedInput.data() + kModelInputMax * i, kModelInputMax);
    inputTensor = executorch::extension::from_blob(
        chunk.data(), {kModelInputMax, kPaddedWindowSize},
        executorch::aten::ScalarType::Float);
    auto forwardResult = BaseModel::forward(inputTensor);
    CHECK_OK_OR_THROW_FORWARD_ERROR(forwardResult);
    auto tensor = forwardResult->at(0).toTensor();
    startIdx = utils::getNonSpeechClassProbabilites(
        tensor, tensor.size(2), tensor.size(1), scores, startIdx);
  }

  std::span<std::array<float, kPaddedWindowSize>> lastChunk(
      windowedInput.data() + kModelInputMax * chunksNumber, lastChunkSize);
  inputTensor = executorch::extension::from_blob(
      lastChunk.data(), {lastChunkSize, kPaddedWindowSize},
      executorch::aten::ScalarType::Float);
  auto forwardResult = BaseModel::forward(inputTensor);
  CHECK_OK_OR_THROW_FORWARD_ERROR(forwardResult);
  auto tensor = forwardResult->at(0).toTensor();
  startIdx = utils::getNonSpeechClassProbabilites(tensor, tensor.size(2),
                                                  remainder, scores, startIdx);
  return postprocess(scores, kSpeechThreshold, mergeGap);
}

void VoiceActivityDetection::stream(std::shared_ptr<jsi::Function> callback,
                                    uint32_t timeout,
                                    uint32_t detectionMargin) {
  bool expected = false;
  if (!isStreaming_.compare_exchange_strong(expected, true)) {
    throw RnExecutorchError(RnExecutorchErrorCode::StreamingInProgress,
                            "Streaming is already in progress!");
  }

  // RAII guard
  struct StreamingGuard {
    VoiceActivityDetection *self;
    ~StreamingGuard() {
      self->isStreaming_ = false;
      std::scoped_lock lock(self->audioBufferMutex_);
      self->audioBuffer_.clear();
    }
  } guard{this};

  // Build a native callback which simply sends a boolean signal,
  // where true corresponds to detected ongoing speech, and false corresponds to
  // silence.
  auto nativeCallback = [this, callback](bool speaking) {
    callInvoker_->invokeAsync([callback, speaking](jsi::Runtime &rt) {
      callback->call(rt, jsi::Value(speaking));
    });
  };

  while (isStreaming_) {
    // Make sure that audio buffer does not exceed it's max size
    // BEFORE infering the model, such that potentially save 1 unnecessary
    // iteration.
    {
      std::scoped_lock lock(audioBufferMutex_);
      if (audioBuffer_.size() > constants::kStreamBufferMaxSize) {
        // Keep the most recent audio samples in.
        size_t cut = audioBuffer_.size() - constants::kStreamBufferMinReserve;
        audioBuffer_.erase(audioBuffer_.begin(), audioBuffer_.begin() + cut);
      }
    }

    std::vector<float> snapshot;
    {
      // Copy under lock so a concurrent streamInsert that grows audioBuffer_
      // past its reserved capacity (causing a reallocation) can't invalidate
      // the data we hand to generate().
      std::scoped_lock lock(audioBufferMutex_);
      snapshot.assign(audioBuffer_.begin(), audioBuffer_.end());
    }

    std::vector<types::Segment> detection = generate(snapshot);

    bool speaking = false;

    // Get the last detected speech segment (if any exists) and
    // check if it is recent enough to consider the speech as ongoing.
    if (!detection.empty()) {
      auto lastSegment = detection.back();
      auto speechEnd = lastSegment.end;

      std::scoped_lock lock(audioBufferMutex_);
      uint32_t diffMs =
          (audioBuffer_.size() - speechEnd) / constants::kSamplesPerMs; // [ms]

      speaking = diffMs <= detectionMargin;
    }

    // Send result to the JS side.
    nativeCallback(speaking);

    std::unique_lock<std::mutex> lock(streamCvMutex_);
    streamCv_.wait_for(lock, std::chrono::milliseconds(timeout),
                       [this] { return !isStreaming_.load(); });
  }
}

void VoiceActivityDetection::streamStop() {
  isStreaming_ = false;
  streamCv_.notify_all();
}

void VoiceActivityDetection::streamInsert(std::span<const float> audio) {
  std::scoped_lock lock(audioBufferMutex_);
  audioBuffer_.insert(audioBuffer_.end(), audio.begin(), audio.end());
}

std::vector<std::array<float, kPaddedWindowSize>>
VoiceActivityDetection::preprocess(std::span<float> waveform) const {
  auto kHammingWindowArray = dsp::hannWindow(kWindowSize);

  const size_t numFrames = (waveform.size() - kWindowSize) / kHopLength;

  std::vector<std::array<float, kPaddedWindowSize>> frameBuffer(
      numFrames, std::array<float, kPaddedWindowSize>{});

  constexpr size_t totalPadding = kPaddedWindowSize - kWindowSize;
  constexpr size_t leftPadding = totalPadding / 2;
  for (size_t i = 0; i < numFrames; i++) {

    auto windowView = waveform.subspan(i * kHopLength, kWindowSize);
    ranges::copy(windowView, frameBuffer[i].begin() + leftPadding);
    auto frameView =
        std::span{frameBuffer[i].data() + leftPadding, kWindowSize};
    const float sum = std::reduce(frameView.begin(), frameView.end(), 0.0f);
    const float mean = sum / kWindowSize;
    ranges::transform(frameView, frameView.begin(),
                      [mean](float value) { return value - mean; });

    // apply pre-emphasis filter
    for (auto j = frameView.size() - 1; j > 0; --j) {
      frameView[j] -= kPreemphasisCoeff * frameView[j - 1];
    }
    // apply hamming window to reduce spectral leakage
    ranges::transform(frameView, kHammingWindowArray, frameView.begin(),
                      std::multiplies{});
  }
  return frameBuffer;
}

std::vector<types::Segment>
VoiceActivityDetection::postprocess(const std::vector<float> &scores,
                                    float threshold, uint32_t mergeGap) const {
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
        } else if (i - potentialStart >= kMinSpeechDurationMs / kHopLengthMs) {
          triggered = true;
          startSegment = potentialStart;
          potentialStart = -1;
        }
      } else { // score < threshold
        potentialStart = -1;
      }
    } else { // triggered
      if (score < threshold) {
        if (potentialEnd == -1) {
          potentialEnd = i;
        } else if (i - potentialEnd >= kMinSilenceDurationMs / kHopLengthMs) {
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
  if (triggered) {
    endSegment = scores.size();
    speechSegments.emplace_back(startSegment, endSegment);
  }

  constexpr size_t kSpeechPadHops = kSpeechPadMs / kHopLengthMs;
  for (auto &[start, end] : speechSegments) {
    // std::max(start-kSpeechPadHops, 0) might be underflow that is why we use ?
    // operator.
    start = (start > kSpeechPadHops ? start - kSpeechPadHops : 0) * kHopLength;
    end = std::min(end + kSpeechPadHops, scores.size()) * kHopLength;
  }

  // Merge tightly placed segments according to the max allowed gap parameter.
  size_t maxMergeGap = mergeGap * constants::kSamplesPerMs;
  return utils::mergeSegments(speechSegments, maxMergeGap);
}

} // namespace rnexecutorch::models::voice_activity_detection
