#pragma once

#include "rnexecutorch/models/speech_to_text/asr/ASR.h"
#include "rnexecutorch/models/speech_to_text/stream/HypothesisBuffer.h"
#include "rnexecutorch/models/speech_to_text/types/ProcessResult.h"
#include "rnexecutorch/models/speech_to_text/types/Word.h"

#include <mutex>

namespace rnexecutorch::models::speech_to_text::stream {

class OnlineASRProcessor {
public:
  explicit OnlineASRProcessor(const asr::ASR *asr);

  void insertAudioChunk(std::span<const float> audio);
  types::ProcessResult processIter(const types::DecodingOptions &options);
  std::vector<types::Word> finish();

  std::vector<float> audioBuffer;
  mutable std::mutex audioMutex;

private:
  const asr::ASR *asr;
  constexpr static int32_t kSamplingRate = 16000;

  HypothesisBuffer hypothesisBuffer;
  float bufferTimeOffset = 0.0f;
  std::vector<types::Word> committed;

  void chunkCompletedSegment(std::span<const types::Segment> res);
  void chunkAt(float time);
};

} // namespace rnexecutorch::models::speech_to_text::stream
