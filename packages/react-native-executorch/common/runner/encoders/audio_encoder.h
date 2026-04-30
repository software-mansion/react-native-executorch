// common/runner/encoders/audio_encoder.h
#pragma once

#include "iencoder.h"
#include <executorch/extension/module/module.h>
#include <executorch/runtime/core/evalue.h>
#include <runner/multimodal_input.h>

#include <cstdint>
#include <vector>

namespace executorch::extension::llm {

// Runs the Gemma4 `audio_encoder` PTE method.
//
// Contract mirrors SpeechToText (Whisper): JS hands in fp32 mono 16 kHz PCM
// via `MultimodalInput::get_audio()`; the PTE owns the log-mel frontend so
// this class just wraps the samples in a `[1, N_samples]` Float tensor and
// executes. Resampling and WAV/MP3 decoding are the caller's responsibility
// (e.g. react-native-audio-api).
class AudioEncoder : public IEncoder {
public:
  explicit AudioEncoder(::executorch::extension::Module &module);

  ::executorch::runtime::Error load() override;
  bool is_loaded() const noexcept override;
  ::executorch::runtime::Result<::executorch::runtime::EValue>
  encode(const MultimodalInput &input) override;
  // Number of audio embedding tokens produced per encode() call. 0 until first
  // encode, since Gemma4's audio_encoder has a dynamic T dim.
  int32_t encoderTokenCount() const override;

private:
  ::executorch::extension::Module *module_;
  int32_t last_token_count_ = 0;
  std::vector<float> padded_wav_;
  std::vector<uint8_t> padded_mask_;
};

} // namespace executorch::extension::llm
