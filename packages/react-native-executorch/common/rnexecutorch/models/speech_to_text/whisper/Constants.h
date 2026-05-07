#pragma once

#include <cinttypes>
#include <string>
#include <unordered_set>

namespace rnexecutorch::models::speech_to_text::whisper::constants {

// Maximum duration of each audio chunk to process (in seconds)
// It is intentionally set to 29 since otherwise only the last chunk would be
// correctly transcribe due to the model's positional encoding limit
constexpr static size_t kChunkSize = 29;

// Sampling rate expected by Whisper and the model's audio pipeline (16 kHz)
constexpr static size_t kSamplingRate = 16000;
constexpr static size_t kSamplesPerMilisecond = kSamplingRate / 1000;

constexpr static size_t kMaxSamples = kChunkSize * kSamplingRate;

// The maximum number of tokens the decoder can generate per chunk
constexpr static size_t kMaxDecodeLength = 128;

// Minimum allowed chunk length before processing (in audio samples)
constexpr static size_t kMinChunkSamples = 1 * kSamplingRate;

// Number of mel frames output by the encoder (derived from input spectrogram)
constexpr static size_t kNumFrames = 1500;

// Time precision used by Whisper timestamps: each token spans 0.02 seconds
constexpr static float kTimePrecision = 0.02f;

// Special characters serving as pause / end of sentence
static const std::unordered_set<char> kPunctations = {',', '.', '?',
                                                      '!', ':', ';'};
static const std::unordered_set<char> kEosPunctations = {'.', '?', '!', ';'};

// Special token constants
namespace tokens {
static const std::string kStartOfTranscript = "<|startoftranscript|>";
static const std::string kEndOfTranscript = "<|endoftext|>";
static const std::string kBeginTimestamp = "<|0.00|>";
static const std::string kBlankAudio = "[BLANK_AUDIO]";
} // namespace tokens

} // namespace rnexecutorch::models::speech_to_text::whisper::constants