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
  transcribe(std::span<float> waveform,
             const types::DecodingOptions &options) const;
  std::vector<float> encode(std::span<float> waveform) const;
  std::vector<float> decode(std::span<const uint64_t> tokens,
                            std::span<float> encoderOutput) const;

private:
  const models::BaseModel *encoder;
  const models::BaseModel *decoder;
  const TokenizerModule *tokenizer;

  uint64_t startOfTranscriptionToken;
  uint64_t endOfTranscriptionToken;
  uint64_t timestampBeginToken;

  // Time precision used by Whisper timestamps: each token spans 0.02 seconds
  constexpr static float kTimePrecision = 0.02f;
  // The maximum number of tokens the decoder can generate per chunk
  constexpr static int32_t kMaxDecodeLength = 128;
  // Maximum duration of each audio chunk to process (in seconds)
  // It is intentionally set to 29 since otherwise only the last chunk would be
  // correctly transcribe due to the model's positional encoding limit
  constexpr static int32_t kChunkSize = 29;
  // Sampling rate expected by Whisper and the model's audio pipeline (16 kHz)
  constexpr static int32_t kSamplingRate = 16000;
  // Minimum allowed chunk length before processing (in audio samples)
  constexpr static int32_t kMinChunkSamples = 1 * 16000;
  // Number of mel frames output by the encoder (derived from input spectrogram)
  constexpr static int32_t kNumFrames = 1500;

  std::vector<uint64_t>
  getInitialSequence(const types::DecodingOptions &options) const;
  types::GenerationResult generate(std::span<float> waveform, float temperature,
                                   const types::DecodingOptions &options) const;
  std::vector<types::Segment>
  generateWithFallback(std::span<float> waveform,
                       const types::DecodingOptions &options) const;
  std::vector<Segment>
  calculateWordLevelTimestamps(std::span<const uint64_t> generatedTokens,
                               const std::span<const float> waveform,
                               float avgLogProb, float temperature,
                               float compressionRatio) const;
  std::vector<types::Word>
  estimateWordLevelTimestampsLinear(std::span<const uint64_t> tokens,
                                    uint64_t start, uint64_t end) const;
  float getCompressionRatio(const std::string &text) const;
};

} // namespace rnexecutorch::models::speech_to_text::asr
