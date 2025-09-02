#include "OnlineASRProcessor.h"

OnlineASRProcessor::OnlineASRProcessor(ASR &asr) : asr(asr) {}

void OnlineASRProcessor::insertAudioChunk(std::span<const float> audio) {
  audioBuffer.insert(audioBuffer.end(), audio.begin(), audio.end());
}

ProcessResult OnlineASRProcessor::processIter(const DecodingOptions &options) {
  std::vector<Segment> res = asr.transcribe(audioBuffer, options);

  std::vector<Word> tsw;
  for (const auto &segment : res) {
    for (const auto &word : segment.words) {
      tsw.push_back(word);
    }
  }

  transcriptBuffer.insert(tsw, bufferTimeOffset);
  std::vector<Word> flushed = transcriptBuffer.flush();
  committed.insert(committed.end(), flushed.begin(), flushed.end());

  constexpr int chunkThresholdSec = 15;
  if (static_cast<float>(audioBuffer.size()) / samplingRate >
      chunkThresholdSec) {
    chunkCompletedSegment(res);
  }

  auto [b, e, committedText] = toFlush(flushed);

  std::ostringstream nonCommittedStream;
  for (const auto &w : transcriptBuffer.complete()) {
    nonCommittedStream << w.content;
  }

  return {committedText, nonCommittedStream.str()};
}

void OnlineASRProcessor::chunkCompletedSegment(std::span<const Segment> res) {
  if (committed.empty())
    return;

  std::vector<float> ends(res.size());
  std::transform(res.begin(), res.end(), ends.begin(),
                 [](const Segment &seg) { return seg.words.back().end; });

  float t = committed.back().end;

  if (ends.size() > 1) {
    float e = ends[ends.size() - 2] + bufferTimeOffset;
    while (ends.size() > 2 && e > t) {
      ends.pop_back();
      e = ends[ends.size() - 2] + bufferTimeOffset;
    }
    if (e <= t) {
      chunkAt(e);
    }
  }
}

void OnlineASRProcessor::chunkAt(float time) {
  transcriptBuffer.popCommitted(time);

  float cutSeconds = time - bufferTimeOffset;
  size_t startIndex = static_cast<size_t>(cutSeconds * samplingRate);

  if (startIndex < audioBuffer.size()) {
    audioBuffer.erase(audioBuffer.begin(), audioBuffer.begin() + startIndex);
  } else {
    audioBuffer.clear();
  }

  bufferTimeOffset = time;
}

std::string OnlineASRProcessor::finish() {
  std::vector<Word> o = transcriptBuffer.complete();
  auto [b, e, committedText] = toFlush(o);
  this->bufferTimeOffset +=
      static_cast<float>(audioBuffer.size()) / samplingRate;
  return committedText;
}

std::tuple<float, float, std::string>
OnlineASRProcessor::toFlush(std::span<const Word> words) const {
  std::ostringstream oss;
  for (size_t i = 0; i < words.size(); i++) {
    oss << words[i].content;
  }

  float b = words.empty() ? -1.0f : words.front().start;
  float e = words.empty() ? -1.0f : words.back().end;
  return {b, e, oss.str()};
}
