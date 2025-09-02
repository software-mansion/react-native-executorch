#pragma once

#include "rnexecutorch/models/speech_to_text/asr/ASR.h"
#include "rnexecutorch/models/speech_to_text/stream/HypothesisBuffer.h"

struct ProcessResult {
  std::string committed;
  std::string nonCommitted;
};

class OnlineASRProcessor {
public:
  explicit OnlineASRProcessor(ASR &asr);

  void insertAudioChunk(std::span<const float> audio);
  ProcessResult processIter(const DecodingOptions &options);
  std::string finish();

  std::vector<float> audioBuffer;

private:
  ASR &asr;
  constexpr static int samplingRate = 16000;

  HypothesisBuffer transcriptBuffer;
  float bufferTimeOffset = 0.0f;
  std::vector<Word> committed;

  void chunkCompletedSegment(std::span<const Segment> res);
  void chunkAt(float time);

  std::tuple<float, float, std::string>
  toFlush(std::span<const Word> words) const;
};
