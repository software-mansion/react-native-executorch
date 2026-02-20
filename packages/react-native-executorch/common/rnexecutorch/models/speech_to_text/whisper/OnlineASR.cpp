#include <algorithm>
#include <iterator>
#include <numeric>
#include <sstream>

#include "Constants.h"
#include "OnlineASR.h"
#include "Params.h"

namespace rnexecutorch::models::speech_to_text::whisper::stream {

namespace {
// A helper function to avoid code duplication.
std::vector<Word> move_to_vector(std::deque<Word> &container) {
  return std::vector<Word>(std::make_move_iterator(container.begin()),
                           std::make_move_iterator(container.end()));
};
} // namespace

OnlineASR::OnlineASR(const ASR *asr) : asr_(asr) {
  // Reserve a minimal expected amount of memory for audio buffer.
  audioBuffer_.reserve(static_cast<size_t>(2 * params::kStreamChunkThreshold *
                                           constants::kSamplingRate));
}

void OnlineASR::insertAudioChunk(std::span<const float> audio) {
  audioBuffer_.insert(audioBuffer_.end(), audio.begin(), audio.end());

  // Update the epsilon accordingly to the amount of added audio.
  epsilon_ += static_cast<float>(audio.size()) / constants::kSamplingRate;
}

bool OnlineASR::isReady() const {
  return audioBuffer_.size() >= constants::kMinChunkSamples;
}

ProcessResult OnlineASR::process(const DecodingOptions &options) {
  // Perform a transcription process to obtain results for
  // the current state of the audio buffer.
  std::vector<Segment> transcriptions = asr_->transcribe(audioBuffer_, options);

  if (transcriptions.empty()) {
    return {.committed = {}, .nonCommitted = {}};
  }

  // Flatten segments into a single word sequence.
  // In this case, Word consists of text and timestamps.
  std::vector<Word> words;
  words.reserve(transcriptions.front().words.size());

  // Note that we transfer the ownership of moves, so words should not be
  // accessed by transcriptions.segment.words afterwards.
  for (auto &segment : transcriptions) {
    words.insert(words.end(), std::make_move_iterator(segment.words.begin()),
                 std::make_move_iterator(segment.words.end()));
  }

  hypothesisBuffer_.insert(words, bufferTimeOffset_);

  // Apply fix for timestamps.
  // After the insert() call on hypothesis buffer, the inner fresh_ buffer
  // contains either a completely new words or words which overlap only
  // with the inner hypothesis_ buffer.
  if (!hypothesisBuffer_.fresh_.empty()) {
    float establishedEnd = !hypothesisBuffer_.committed_.empty()
                               ? hypothesisBuffer_.committed_.back().end
                               : 0.F;
    const float newEnd = hypothesisBuffer_.fresh_.back().end;
    float newBegin = hypothesisBuffer_.fresh_.front().start;

    for (size_t i = 0; i < hypothesisBuffer_.fresh_.size(); i++) {
      // If the word overlaps with the hypothesis, we can simply copy the
      // timestamps from the previous iteration (that is, from the hypothesis
      // inner buffer).
      if (i < hypothesisBuffer_.hypothesis_.size() &&
          hypothesisBuffer_.fresh_[i].content ==
              hypothesisBuffer_.hypothesis_[i].content) {
        hypothesisBuffer_.fresh_[i].start =
            hypothesisBuffer_.hypothesis_[i].start;
        hypothesisBuffer_.fresh_[i].end = hypothesisBuffer_.hypothesis_[i].end;

        establishedEnd = hypothesisBuffer_.hypothesis_[i].end;
        newBegin = hypothesisBuffer_.fresh_[i].end;

        continue;
      }

      // In case of a new word, we apply timestamp range scaling
      // based on timestamps established in previous iterations.
      // The idea is, that both ranges of established and completely new words
      // should sum up to the final timestamp produced by the model.
      // TODO: estimate the epsilon value
      const float beforeScaleStart = hypothesisBuffer_.fresh_[i].start;
      const float beforeScaleEnd = hypothesisBuffer_.fresh_[i].end;
      float scale =
          (newEnd - establishedEnd) / (newEnd - newBegin); // missing epsilon
      // float scale = (newEnd - establishedEnd - epsilon) / (newEnd -
      // newBegin); // correct
      hypothesisBuffer_.fresh_[i].start =
          (hypothesisBuffer_.fresh_[i].start - newEnd) * scale + newEnd;
      hypothesisBuffer_.fresh_[i].end =
          (hypothesisBuffer_.fresh_[i].end - newEnd) * scale + newEnd;
    }

    // Before committing, save the last timestamp produced by the model.
    // That is, the ending timestamp of the last fresh word.
    lastNonSilentMoment_ = newEnd;
  }

  // Commit matching words.
  auto committed = hypothesisBuffer_.commit();
  auto nonCommitted = hypothesisBuffer_.hypothesis_;

  // Cut the audio buffer to not exceed the size threshold.
  // Since Whisper does not accept waveforms longer than 30 seconds, we need
  // to cut the audio at some safe point.
  const float audioDuration =
      static_cast<float>(audioBuffer_.size()) / constants::kSamplingRate;
  if (audioDuration > params::kStreamChunkThreshold) {
    // Leave some portion of audio in, to improve model behavior
    // in future iterations.
    const float erasedDuration =
        audioDuration - params::kStreamAudioBufferReserve;
    const size_t nSamplesToErase =
        static_cast<size_t>(erasedDuration * constants::kSamplingRate);

    audioBuffer_.erase(audioBuffer_.begin(),
                       audioBuffer_.begin() + nSamplesToErase);
    bufferTimeOffset_ += erasedDuration;
  }

  return {.committed = move_to_vector(committed),
          .nonCommitted = move_to_vector(nonCommitted)};
}

std::vector<Word> OnlineASR::finish() {
  // We always push the last remaining hypothesis, even if it's not
  // confirmed in second iteration.
  auto remaining = hypothesisBuffer_.hypothesis_;

  reset();

  return move_to_vector(remaining);
}

void OnlineASR::reset() {
  hypothesisBuffer_.reset();
  bufferTimeOffset_ = 0.f;

  audioBuffer_.clear();
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
