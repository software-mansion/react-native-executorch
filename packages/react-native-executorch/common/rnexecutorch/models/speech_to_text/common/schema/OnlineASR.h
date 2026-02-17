#pragma once

#include <span>
#include <vector>

#include "../types/DecodingOptions.h"
#include "../types/ProcessResult.h"
#include "../types/Word.h"

namespace rnexecutorch::models::speech_to_text::schema {

/**
 * @brief Abstract base class for Online (streaming) Automatic Speech
 * Recognition.
 *
 * Provides an interface for processing audio in chunks, allowing for real-time
 * transcription results. Implementations of this interface typically maintain
 * an internal audio buffer and a hypothesis buffer for incremental decoding.
 *
 * Requires 5 main methods to be implemented:
 * - insertAudioChunk(): for expanding the collected audio (typically adding to
 * a buffer)
 * - ready(): returns a boolean flag indicating whether the module is ready to
 * process the next iteration
 * - process(): for processing a next chunk of audio (next iterartion)
 * - finish(): called to finish the live transcription mode
 * - reset(): resets the streaming state
 */
class OnlineASR {
public:
  virtual ~OnlineASR() = default;

  virtual void insertAudioChunk(std::span<const float> audio) = 0;

  virtual bool ready() const = 0;

  virtual ProcessResult process(const DecodingOptions &options) = 0;

  virtual std::vector<Word> finish() = 0;

  virtual void reset() = 0;
};

} // namespace rnexecutorch::models::speech_to_text::schema
