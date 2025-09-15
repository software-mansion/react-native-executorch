#include <numeric>

#include "OnlineASRProcessor.h"

namespace rnexecutorch::models::speech_to_text::stream {

using namespace asr;
using namespace types;

OnlineASRProcessor::OnlineASRProcessor(const ASR *asr) : asr(asr) {}

void OnlineASRProcessor::insertAudioChunk(std::span<const float> audio) {
  audioBuffer.insert(audioBuffer.end(), audio.begin(), audio.end());
}

ProcessResult OnlineASRProcessor::processIter(const DecodingOptions &options) {
  std::vector<Segment> res = asr->transcribe(audioBuffer, options);

  std::vector<Word> tsw;
  for (const auto &segment : res) {
    for (const auto &word : segment.words) {
      tsw.push_back(word);
    }
  }

  this->hypothesisBuffer.insert(tsw, this->bufferTimeOffset);
  std::deque<Word> flushed = this->hypothesisBuffer.flush();
  this->committed.insert(this->committed.end(), flushed.begin(), flushed.end());

  constexpr int32_t chunkThresholdSec = 15;
  if (static_cast<float>(audioBuffer.size()) /
          OnlineASRProcessor::kSamplingRate >
      chunkThresholdSec) {
    chunkCompletedSegment(res);
  }

  std::deque<Word> nonCommittedWords = this->hypothesisBuffer.complete();
  return {this->toFlush(flushed), this->toFlush(nonCommittedWords)};
}

void OnlineASRProcessor::chunkCompletedSegment(std::span<const Segment> res) {
  if (this->committed.empty())
    return;

  std::vector<float> ends(res.size());
  std::ranges::transform(res, ends.begin(), [](const Segment &seg) {
    return seg.words.back().end;
  });

  const float t = this->committed.back().end;

  if (ends.size() > 1) {
    float e = ends[ends.size() - 2] + this->bufferTimeOffset;
    while (ends.size() > 2 && e > t) {
      ends.pop_back();
      e = ends[ends.size() - 2] + this->bufferTimeOffset;
    }
    if (e <= t) {
      chunkAt(e);
    }
  }
}

void OnlineASRProcessor::chunkAt(float time) {
  this->hypothesisBuffer.popCommitted(time);

  const float cutSeconds = time - this->bufferTimeOffset;
  auto startIndex =
      static_cast<size_t>(cutSeconds * OnlineASRProcessor::kSamplingRate);

  if (startIndex < audioBuffer.size()) {
    audioBuffer.erase(audioBuffer.begin(), audioBuffer.begin() + startIndex);
  } else {
    audioBuffer.clear();
  }

  this->bufferTimeOffset = time;
}

std::string OnlineASRProcessor::finish() {
  const std::deque<Word> buffer = this->hypothesisBuffer.complete();
  std::string committedText = this->toFlush(buffer);
  this->bufferTimeOffset += static_cast<float>(audioBuffer.size()) /
                            OnlineASRProcessor::kSamplingRate;
  return committedText;
}

std::string OnlineASRProcessor::toFlush(const std::deque<Word> &words) const {
  std::string text;
  text.reserve(std::accumulate(
      words.cbegin(), words.cend(), 0,
      [](size_t sum, const Word &w) { return sum + w.content.size(); }));
  for (const auto &word : words) {
    text.append(word.content);
  }
  return text;
}

} // namespace rnexecutorch::models::speech_to_text::stream
