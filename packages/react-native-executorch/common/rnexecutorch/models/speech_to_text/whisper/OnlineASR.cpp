#include "OnlineASR.h"
#include "Constants.h"
#include <algorithm>
#include <iterator>
#include <numeric>
#include <sstream>

#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::speech_to_text::whisper::stream {

namespace {
std::string wordsToString(const auto &words) {
  std::stringstream ss;
  ss << "[";
  for (size_t i = 0; i < words.size(); ++i) {
    ss << "'" << words[i].content << "' (" << words[i].start << "s - "
       << words[i].end << "s)";
    if (i < words.size() - 1)
      ss << ", ";
  }
  ss << "]";
  return ss.str();
}
} // namespace

OnlineASR::OnlineASR(const ASR *asr) : asr_(asr) {}

void OnlineASR::insertAudioChunk(std::span<const float> audio) {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Inserting audio chunk of size: " +
                        std::to_string(audio.size()));
  audioBuffer_.insert(audioBuffer_.end(), audio.begin(), audio.end());
}

ProcessResult OnlineASR::process(const DecodingOptions &options) {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Starting process iteration...");

  // Transcribe the current audio buffer.
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Running transcription on audio buffer...");
  std::vector<Segment> res = asr_->transcribe(audioBuffer_, options);

  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Transcription returned " +
                        std::to_string(res.size()) + " segments.");
  for (size_t i = 0; i < res.size(); ++i) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "  Segment " + std::to_string(i) + ": " +
                          wordsToString(res[i].words));
  }

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
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Flattened transcription into " +
                        std::to_string(tsw.size()) + " words.");

  // Update hypothesis buffer and commit stable words.
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Inserting " + std::to_string(tsw.size()) +
                        " words into hypothesis buffer with offset " +
                        std::to_string(bufferTimeOffset_) + "s.");
  hypothesisBuffer_.insert(tsw, bufferTimeOffset_);

  std::deque<Word> flushed = hypothesisBuffer_.flush();
  if (!flushed.empty()) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[OnlineASR] Flushed " + std::to_string(flushed.size()) +
                          " stable words: " + wordsToString(flushed));
  } else {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[OnlineASR] No stable words flushed this iteration.");
  }

  committed_.insert(committed_.end(), flushed.begin(), flushed.end());
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Total committed words history size: " +
                        std::to_string(committed_.size()));

  // Prune processed audio if buffer exceeds threshold (15 seconds).
  const float audioDuration =
      static_cast<float>(audioBuffer_.size()) / constants::kSamplingRate;
  constexpr int32_t chunkThresholdSec = 15;
  if (audioDuration > chunkThresholdSec) {
    rnexecutorch::log(
        rnexecutorch::LOG_LEVEL::Info,
        "[OnlineASR] Audio buffer duration (" + std::to_string(audioDuration) +
            "s) exceeds threshold (" + std::to_string(chunkThresholdSec) +
            "s). Triggering pruning check.");
    chunkCompletedSegment(res);
  }

  auto move_to_vector = [](std::deque<Word> &container) {
    return std::vector<Word>(std::make_move_iterator(container.begin()),
                             std::make_move_iterator(container.end()));
  };

  std::deque<Word> nonCommittedWords = hypothesisBuffer_.complete();
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Current hypothesis (non-committed): " +
                        wordsToString(nonCommittedWords));

  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Finished process iteration.");
  return {move_to_vector(flushed), move_to_vector(nonCommittedWords)};
}

bool OnlineASR::ready() const {
  return audioBuffer_.size() >= constants::kMinChunkSamples;
}

void OnlineASR::chunkCompletedSegment(std::span<const Segment> res) {
  if (committed_.empty() || res.empty()) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[OnlineASR] Pruning skipped: insufficient data.");
    return;
  }

  const float lastCommittedTimestamp = committed_.back().end;

  // Search backwards for the last segment that finished before the last
  // committed word. We skip the very last segment to maintain context for
  // future iterations.
  for (int i = static_cast<int>(res.size()) - 2; i >= 0; --i) {
    float segmentEndAbsolute = res[i].end + bufferTimeOffset_;
    if (segmentEndAbsolute <= lastCommittedTimestamp) {
      rnexecutorch::log(
          rnexecutorch::LOG_LEVEL::Info,
          "[OnlineASR] Found stable pruning point at absolute time: " +
              std::to_string(segmentEndAbsolute) + "s.");
      chunkAt(segmentEndAbsolute);
      break;
    }
  }
}

void OnlineASR::chunkAt(float time) {
  rnexecutorch::log(
      rnexecutorch::LOG_LEVEL::Info,
      "[OnlineASR] Pruning buffers at time: " + std::to_string(time) + "s.");

  hypothesisBuffer_.popCommitted(time);

  const float cutSeconds = time - bufferTimeOffset_;
  auto startIndex = static_cast<size_t>(cutSeconds * constants::kSamplingRate);

  if (startIndex < audioBuffer_.size()) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[OnlineASR] Erasing " + std::to_string(startIndex) +
                          " audio samples.");
    audioBuffer_.erase(audioBuffer_.begin(), audioBuffer_.begin() + startIndex);
  } else {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[OnlineASR] Clearing entire audio buffer.");
    audioBuffer_.clear();
  }

  bufferTimeOffset_ = time;
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] New buffer time offset: " +
                        std::to_string(bufferTimeOffset_) + "s.");
}

std::vector<Word> OnlineASR::finish() {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Finalizing streaming session.");
  std::deque<Word> bufferDeq = hypothesisBuffer_.complete();
  std::vector<Word> buffer(std::make_move_iterator(bufferDeq.begin()),
                           std::make_move_iterator(bufferDeq.end()));

  bufferTimeOffset_ +=
      static_cast<float>(audioBuffer_.size()) / constants::kSamplingRate;

  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Stream finished. Final hypothesis words: " +
                        wordsToString(buffer));

  // Final cleanup - usually involves clearing local state for next session
  reset();

  return buffer;
}

void OnlineASR::reset() {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[OnlineASR] Resetting streaming state.");
  hypothesisBuffer_.reset();
  bufferTimeOffset_ = 0.f;

  audioBuffer_.clear();
  committed_.clear();
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
