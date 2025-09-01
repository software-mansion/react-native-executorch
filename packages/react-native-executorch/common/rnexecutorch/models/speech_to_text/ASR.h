#pragma once

#include <span>

#include "DecodingOptions.h"
#include "Segment.h"
#include "rnexecutorch/TokenizerModule.h"
#include "rnexecutorch/models/EncoderDecoderBase.h"

using namespace rnexecutorch;

class ASR : public models::EncoderDecoderBase {
public:
  explicit ASR(const std::string &encoderPath, const std::string &decoderPath,
               const std::string &tokenizerPath,
               std::shared_ptr<react::CallInvoker> callInvoker);

  std::vector<Segment> transcribe(std::span<const float> waveform,
                                  const DecodingOptions &options) const;

  std::vector<float> encode(std::span<const float> waveform) const;

  std::vector<float> decode(std::span<const int32_t> tokens,
                            std::span<const float> encoderOutput) const;

private:
  // Time precision used by Whisper timestamp tokens: each token spans 0.02
  // seconds
  constexpr static float timePrecision = 0.02f;

  // The maximum number of tokens the decoder can generate per chunk
  constexpr static int32_t maxDecodeLength = 128;

  // Maximum duration of each audio chunk to process (in seconds)
  constexpr static int32_t chunkSize = 30;

  // Sampling rate expected by Whisper and the model's audio pipeline (16 kHz)
  constexpr static int32_t samplingRate = 16000;

  // Minimum allowed chunk length before processing (in audio samples)
  constexpr static int32_t minChunkSamples = 1 * 16000;

  // Number of mel frames output by the encoder (derived from input spectrogram)
  constexpr static int32_t numFrames = 1500;

  std::unique_ptr<TokenizerModule> tokenizer;
  const int32_t startOfTranscriptionToken;
  const int32_t endOfTranscriptionToken;
  const int32_t timestampBeginToken;

  std::vector<int32_t> getInitialSequence(const DecodingOptions &options) const;

  std::pair<std::vector<int32_t>, std::vector<float>>
  generate(std::span<const float> waveform, float temperature,
           const DecodingOptions &options) const;

  std::vector<float> softmaxWithTemperature(std::span<const float> logits,
                                            float temperature) const;

  std::vector<Segment>
  generateWithFallback(std::span<const float> waveform,
                       const DecodingOptions &options) const;

  std::vector<Segment>
  calculateWordLevelTimestamps(std::span<const int32_t> tokens,
                               std::span<const float> waveform) const;

  std::vector<Word>
  estimateWordLevelTimestampsLinear(std::span<const int32_t> tokens,
                                    int32_t start, int32_t end) const;
};
