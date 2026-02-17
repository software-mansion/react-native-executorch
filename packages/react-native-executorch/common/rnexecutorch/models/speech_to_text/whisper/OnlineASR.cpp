#include "OnlineASR.h"
#include "Constants.h"
#include <algorithm>
#include <iterator>
#include <numeric>

namespace rnexecutorch::models::speech_to_text::whisper::stream {

OnlineASR::OnlineASR(const ASR *asr) : asr_(asr) {}

void OnlineASR::insertAudioChunk(std::span<const float> audio) {
  audioBuffer_.insert(audioBuffer_.end(), audio.begin(), audio.end());
}

ProcessResult OnlineASR::process(const DecodingOptions &options) {
  // Transcribe the current audio buffer.
  std::vector<Segment> res = asr_->transcribe(audioBuffer_, options);

  // Flatten segments into a single word sequence.
  std::vector<Word> tsw;
  size_t totalWords = 0;
  for (const auto &segment : res) {
    totalWords += segment.words.size();
  }
  tsw.reserve(totalWords);

  for (const auto &segment : res) {
    tsw.insert(tsw.end(), segment.words.begin(), segment.words.end());
  }

  // Update hypothesis buffer and commit stable words.
  hypothesisBuffer_.insert(tsw, bufferTimeOffset_);
  std::deque<Word> flushed = hypothesisBuffer_.flush();
  committed_.insert(committed_.end(), flushed.begin(), flushed.end());

  // Prune processed audio if buffer exceeds threshold (15 seconds).
  constexpr int32_t chunkThresholdSec = 15;
  if (static_cast<float>(audioBuffer_.size()) / constants::kSamplingRate >
      chunkThresholdSec) {
    chunkCompletedSegment(res);
  }

  auto move_to_vector = [](std::deque<Word> &container) {
    return std::vector<Word>(std::make_move_iterator(container.begin()),
                             std::make_move_iterator(container.end()));
  };

  std::deque<Word> nonCommittedWords = hypothesisBuffer_.complete();

  return {move_to_vector(flushed), move_to_vector(nonCommittedWords)};
}

bool OnlineASR::ready() const {
  return audioBuffer_.size() >= constants::kMinChunkSamples;
}

void OnlineASR::chunkCompletedSegment(std::span<const Segment> res) {
  if (committed_.empty() || res.empty()) {
    return;
  }

  const float lastCommittedTimestamp = committed_.back().end;

  // Search backwards for the last segment that finished before the last
  // committed word. We skip the very last segment to maintain context for
  // future iterations.
  for (int i = static_cast<int>(res.size()) - 2; i >= 0; --i) {
    float segmentEndAbsolute = res[i].end + bufferTimeOffset_;
    if (segmentEndAbsolute <= lastCommittedTimestamp) {
      chunkAt(segmentEndAbsolute);
      break;
    }
  }
}

void OnlineASR::chunkAt(float time) {
  hypothesisBuffer_.popCommitted(time);

  const float cutSeconds = time - bufferTimeOffset_;
  auto startIndex = static_cast<size_t>(cutSeconds * constants::kSamplingRate);

  if (startIndex < audioBuffer_.size()) {
    audioBuffer_.erase(audioBuffer_.begin(), audioBuffer_.begin() + startIndex);
  } else {
    audioBuffer_.clear();
  }

  bufferTimeOffset_ = time;
}

std::vector<Word> OnlineASR::finish() {
  std::deque<Word> bufferDeq = hypothesisBuffer_.complete();
  std::vector<Word> buffer(std::make_move_iterator(bufferDeq.begin()),
                           std::make_move_iterator(bufferDeq.end()));

  bufferTimeOffset_ +=
      static_cast<float>(audioBuffer_.size()) / constants::kSamplingRate;

  // Final cleanup - usually involves clearing local state for next session
  reset();

  return buffer;
}

void OnlineASR::reset() {
  hypothesisBuffer_.reset();
  bufferTimeOffset_ = 0.f;

  audioBuffer_.clear();
  committed_.clear();
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
