#include <algorithm>
#include <iterator>
#include <numeric>
#include <sstream>

#include "Constants.h"
#include "OnlineASR.h"
#include "Params.h"
#include "Utils.h"

namespace rnexecutorch::models::speech_to_text::whisper::stream {

namespace {
std::vector<Word> move_to_vector(std::deque<Word> &container) {
  return std::vector<Word>(std::make_move_iterator(container.begin()),
                           std::make_move_iterator(container.end()));
}
} // namespace

OnlineASR::OnlineASR(const ASR *asr) : asr_(asr) {
  // Reserve a minimal expected amount of memory for audio buffer.
  audioBuffer_.reserve(static_cast<size_t>(2 * params::kStreamChunkThreshold *
                                           constants::kSamplingRate));
}

void OnlineASR::insertAudioChunk(std::span<const float> audio) {
  audioBuffer_.insert(audioBuffer_.end(), audio.begin(), audio.end());
}

bool OnlineASR::isReady() const {
  return audioBuffer_.size() >= constants::kMinChunkSamples;
}

ProcessResult OnlineASR::process(const DecodingOptions &options) {
  std::vector<Segment> transcriptions = asr_->transcribe(audioBuffer_, options);

  if (transcriptions.empty()) {
    return {.committed = {}, .nonCommitted = {}};
  }

  // Flatten segments into a single word sequence.
  std::vector<Word> words;
  words.reserve(transcriptions.front().words.size());

  for (auto &segment : transcriptions) {
    words.insert(words.end(), std::make_move_iterator(segment.words.begin()),
                 std::make_move_iterator(segment.words.end()));
  }

  hypothesisBuffer_.insert(words, bufferTimeOffset_);

  // Apply fix for timestamps.
  if (!hypothesisBuffer_.fresh_.empty()) {
    size_t noNewWords = hypothesisBuffer_.fresh_.size();
    float establishedEnd = hypothesisBuffer_.lastCommittedTime_;
    float newBegin = hypothesisBuffer_.fresh_.front().start;
    const float newEnd = hypothesisBuffer_.fresh_.back().end;
    float shift = 0.F;
    for (size_t i = 0; i < hypothesisBuffer_.fresh_.size(); i++) {
      const float originalStart = hypothesisBuffer_.fresh_[i].start;
      const float originalEnd = hypothesisBuffer_.fresh_[i].end;
      const std::string &wordContent = hypothesisBuffer_.fresh_[i].content;

      if (i < hypothesisBuffer_.hypothesis_.size() &&
          utils::equalsIgnoreCase(hypothesisBuffer_.fresh_[i].content,
                                  hypothesisBuffer_.hypothesis_[i].content)) {
        hypothesisBuffer_.fresh_[i].start =
            hypothesisBuffer_.hypothesis_[i].start;
        hypothesisBuffer_.fresh_[i].end = hypothesisBuffer_.hypothesis_[i].end;
        shift = hypothesisBuffer_.fresh_[i].end - originalEnd;

        establishedEnd = hypothesisBuffer_.hypothesis_[i].end;
        newBegin = hypothesisBuffer_.fresh_[i].end;
        noNewWords--;
        continue;
      }

      // In case of a new word, we apply timestamp range scaling
      // based on timestamps established in previous iterations.
      const float freshDuration = newEnd - establishedEnd;
      const float epsilon = std::max(
          0.F, 0.85F * (freshDuration -
                        static_cast<float>(noNewWords /
                                           params::kStreamWordsPerSecond)));
      float scale =
          (freshDuration - epsilon) / std::max(newEnd - newBegin, 0.2F);
      const float beforeScaleStart = hypothesisBuffer_.fresh_[i].start;
      const float beforeScaleEnd = hypothesisBuffer_.fresh_[i].end;
      hypothesisBuffer_.fresh_[i].start =
          shift + (hypothesisBuffer_.fresh_[i].start - newEnd) * scale + newEnd;
      hypothesisBuffer_.fresh_[i].end =
          shift + (hypothesisBuffer_.fresh_[i].end - newEnd) * scale + newEnd;
    }
  }

  auto committed = hypothesisBuffer_.commit();
  auto nonCommitted = hypothesisBuffer_.hypothesis_;

  // We want to save the most recent end of sentence word
  // to improve the audio cutting mechanism.
  for (const auto &word : committed) {
    if (!word.punctations.empty()) {
      lastSentenceEnd_ = word.end;
    }
  }

  // Since Whisper does not accept waveforms longer than 30 seconds, we need
  // to cut the audio at some safe point.
  const float audioDuration =
      static_cast<float>(audioBuffer_.size()) / constants::kSamplingRate;
  if (audioDuration > params::kStreamChunkThreshold) {
    // Leave some portion of audio in, to improve model behavior
    // in future iterations.
    const float erasePoint =
        hypothesisBuffer_.lastCommittedTime_ == lastSentenceEnd_
            ? audioDuration
            : std::min(lastSentenceEnd_, params::kStreamChunkThreshold);
    const float minEraseDuration =
        audioDuration - params::kStreamAudioBufferMaxReserve;
    const float maxEraseDuration =
        audioDuration - params::kStreamAudioBufferMinReserve;
    const float eraseDuration = std::clamp(erasePoint - bufferTimeOffset_,
                                           minEraseDuration, maxEraseDuration);
    const size_t nSamplesToErase =
        static_cast<size_t>(eraseDuration * constants::kSamplingRate);

    audioBuffer_.erase(audioBuffer_.begin(),
                       audioBuffer_.begin() + nSamplesToErase);
    bufferTimeOffset_ += eraseDuration;
  }

  return {.committed = move_to_vector(committed),
          .nonCommitted = move_to_vector(nonCommitted)};
}

std::vector<Word> OnlineASR::finish() {
  // We always push the last remaining hypothesis, even if it's not
  // confirmed in second iteration, to avoid ending up with broken sentences.
  std::deque<Word> remaining = hypothesisBuffer_.hypothesis_;

  return move_to_vector(remaining);
}

void OnlineASR::reset() {
  hypothesisBuffer_.reset();
  bufferTimeOffset_ = 0.f;

  audioBuffer_.clear();
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
