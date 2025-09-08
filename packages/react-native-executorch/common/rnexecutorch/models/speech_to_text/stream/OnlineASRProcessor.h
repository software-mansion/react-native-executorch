#pragma once

#include "rnexecutorch/models/speech_to_text/asr/ASR.h"
#include "rnexecutorch/models/speech_to_text/stream/HypothesisBuffer.h"
#include "rnexecutorch/models/speech_to_text/types/ProcessResult.h"

namespace rnexecutorch::models::speech_to_text::stream {

using namespace asr;
using namespace types;

class OnlineASRProcessor {
public:
  explicit OnlineASRProcessor(const ASR *asr);

  void insertAudioChunk(std::span<const float> audio);
  ProcessResult processIter(const DecodingOptions &options);
  std::string finish();

  std::vector<float> audioBuffer;

private:
  const ASR *asr;
  constexpr static int32_t kSamplingRate = 16000;

  HypothesisBuffer hypothesisBuffer;
  float bufferTimeOffset = 0.0f;
  std::vector<Word> committed;

  void chunkCompletedSegment(std::span<const Segment> res);
  void chunkAt(float time);

  std::string toFlush(const std::deque<Word> &words) const;
};

} // namespace rnexecutorch::models::speech_to_text::stream
