#pragma once

#include <cinttypes>
#include <string>

namespace rnexecutorch::models::speech_to_text::whisper::constants {

// Maximum duration of each audio chunk to process (in seconds)
// It is intentionally set to 29 since otherwise only the last chunk would be
// correctly transcribe due to the model's positional encoding limit
constexpr static int32_t kChunkSize = 29;

// The maximum number of tokens the decoder can generate per chunk
constexpr static int32_t kMaxDecodeLength = 128;

// Minimum allowed chunk length before processing (in audio samples)
constexpr static int32_t kMinChunkSamples = 1 * 16000;

// Number of mel frames output by the encoder (derived from input spectrogram)
constexpr static int32_t kNumFrames = 1500;

// Sampling rate expected by Whisper and the model's audio pipeline (16 kHz)
constexpr static int32_t kSamplingRate = 16000;
constexpr static int32_t kSamplesPerMilisecond = kSamplingRate / 1000;

// Time precision used by Whisper timestamps: each token spans 0.02 seconds
constexpr static float kTimePrecision = 0.02f;

// Special token constants
namespace tokens {
static const std::string kStartOfTranscript = "<|startoftranscript|>";
static const std::string kEndOfTranscript = "<|endoftext|>";
static const std::string kBeginTimestamp = "<|0.00|>";
static const std::string kBlankAudio = "[BLANK_AUDIO]";
} // namespace tokens

} // namespace rnexecutorch::models::speech_to_text::whisper::constants