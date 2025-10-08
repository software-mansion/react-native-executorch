#pragma once

#include "rnexecutorch/TokenizerModule.h"
#include "rnexecutorch/models/BaseModel.h"
#include "rnexecutorch/models/speech_to_text/types/DecodingOptions.h"
#include "rnexecutorch/models/speech_to_text/types/GenerationResult.h"
#include "rnexecutorch/models/speech_to_text/types/Segment.h"

namespace rnexecutorch::models::speech_to_text::asr {

class ASR {
public:
  explicit ASR(const models::BaseModel *encoder,
               const models::BaseModel *decoder,
               const TokenizerModule *tokenizer);
  std::vector<types::Segment>
  transcribe(std::span<const float> waveform,
             const types::DecodingOptions &options) const;
  std::vector<float> encode(std::span<const float> waveform) const;
  std::vector<float> decode(std::span<int32_t> tokens,
                            std::span<float> encoderOutput) const;

private:
  const models::BaseModel *encoder;
  const models::BaseModel *decoder;
  const TokenizerModule *tokenizer;

  int32_t startOfTranscriptionToken;
  int32_t endOfTranscriptionToken;
  int32_t timestampBeginToken;

  // Time precision used by Whisper timestamps: each token spans 0.02 seconds
  constexpr static float kTimePrecision = 0.02f;
  // The maximum number of tokens the decoder can generate per chunk
  constexpr static int32_t kMaxDecodeLength = 128;
  // Maximum duration of each audio chunk to process (in seconds)
  constexpr static int32_t kChunkSize = 30;
  // Sampling rate expected by Whisper and the model's audio pipeline (16 kHz)
  constexpr static int32_t kSamplingRate = 16000;
  // Minimum allowed chunk length before processing (in audio samples)
  constexpr static int32_t kMinChunkSamples = 1 * 16000;
  // Number of mel frames output by the encoder (derived from input spectrogram)
  constexpr static int32_t kNumFrames = 1500;

  std::vector<int32_t>
  getInitialSequence(const types::DecodingOptions &options) const;
  types::GenerationResult generate(std::span<const float> waveform,
                                   float temperature,
                                   const types::DecodingOptions &options) const;
  std::vector<types::Segment>
  generateWithFallback(std::span<const float> waveform,
                       const types::DecodingOptions &options) const;
  std::vector<types::Segment>
  calculateWordLevelTimestamps(std::span<const int32_t> tokens,
                               std::span<const float> waveform) const;
  std::vector<types::Word>
  estimateWordLevelTimestampsLinear(std::span<const int32_t> tokens,
                                    int32_t start, int32_t end) const;
  float getCompressionRatio(const std::string &text) const;
};

} // namespace rnexecutorch::models::speech_to_text::asr
