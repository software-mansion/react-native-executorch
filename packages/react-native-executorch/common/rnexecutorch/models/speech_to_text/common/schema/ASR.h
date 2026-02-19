#pragma once

#include <cinttypes>
#include <span>
#include <vector>

#include "../types/DecodingOptions.h"
#include "../types/Segment.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::speech_to_text::schema {

/**
 * @brief Abstract base class for Automatic Speech Recognition (ASR) models.
 *
 * Provides a unified interface for speech-to-text models like Whisper, allowing
 * for transcription of raw audio waveforms into text segments, as well as
 * access to lower-level model components like encoding and decoding.
 */
class ASR {
public:
  virtual ~ASR() = default;

  std::vector<Segment> virtual transcribe(
      std::span<float> waveform, const DecodingOptions &options) const = 0;

  virtual std::vector<float> encode(std::span<float> waveform) const = 0;

  virtual std::vector<float> decode(std::span<uint64_t> tokens,
                                    std::span<float> encoderOutput,
                                    uint64_t startPos = 0) const = 0;

  // Standard ExecuTorch model methods for compatibility with the rest of the
  // API.
  virtual void unload() noexcept = 0;
  virtual std::size_t getMemoryLowerBound() const noexcept = 0;
};

} // namespace rnexecutorch::models::speech_to_text::schema