// common/runner/encoders/audio_encoder.cpp
//
// Pattern mirrors models/speech_to_text/whisper/ASR.cpp::encode — the PTE has
// the log-mel frontend baked in, so this encoder hands the raw waveform
// straight to the `audio_encoder` method. Mel extraction, STFT, filterbank,
// normalization all live inside the exported module.
//
// PTE contract (exp107f onward):
//   inputs:
//     waveform[1, N_padded]  fp32  (N_padded = kSamplesPerBlock * k, k>=1)
//     num_valid_samples[]    int64 (real PCM length before zero-padding)
//   output:
//     embeds[1, 12*k, hidden] fp32
// Caller right-pads the raw waveform up to the next multiple of
// kSamplesPerBlock with silence; num_valid_samples tells MelFrontend which
// mel frames correspond to real audio so padded-silence frames are masked
// out and don't dilute the encoding.

#include "audio_encoder.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
#include <runner/constants.h>

#include <executorch/extension/tensor/tensor.h>

#include <cstdint>
#include <cstring>
#include <vector>

namespace executorch::extension::llm {

using ::executorch::aten::SizesType;
using ::executorch::runtime::Error;
using ::executorch::runtime::EValue;
using ::executorch::runtime::Result;

namespace {
// Matches AUDIO_SAMPLES_PER_BLOCK in gemma_export/experiments/exp107f_*.py.
// The PTE's audio_samples dim was exported as `7680 * audio_blocks`.
constexpr int32_t kSamplesPerBlock = 7680;
} // namespace

AudioEncoder::AudioEncoder(::executorch::extension::Module &module)
    : module_(&module) {}

Error AudioEncoder::load() {
  if (is_loaded()) {
    return Error::Ok;
  }
  auto method_names_result = module_->method_names();
  if (!method_names_result.ok()) {
    return method_names_result.error();
  }
  if (method_names_result->count(kAudioEncoderMethod) == 0) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::InvalidConfig,
        "Model does not support audio: 'audio_encoder' method not found. "
        "Check that the .pte file matches the declared capabilities.");
  }
  return module_->load_method(kAudioEncoderMethod);
}

bool AudioEncoder::is_loaded() const noexcept {
  return module_->is_method_loaded(kAudioEncoderMethod);
}

int32_t AudioEncoder::encoderTokenCount() const { return last_token_count_; }

Result<EValue> AudioEncoder::encode(const MultimodalInput &input) {
  if (!is_loaded()) {
    return Error::InvalidState;
  }
  if (!input.is_audio()) {
    return Error::InvalidArgument;
  }

  const auto &wav = input.get_audio();
  ET_CHECK_OR_RETURN_ERROR(!wav.samples.empty(), InvalidArgument,
                           "AudioEncoder: empty waveform");
  ET_CHECK_OR_RETURN_ERROR(
      wav.sample_rate == 16000, InvalidArgument,
      "AudioEncoder: expected 16000 Hz waveform, got %d Hz", wav.sample_rate);

  const int64_t n_valid = static_cast<int64_t>(wav.samples.size());
  const int64_t k_blocks = (n_valid + kSamplesPerBlock - 1) / kSamplesPerBlock;
  const int64_t n_padded = k_blocks * kSamplesPerBlock;

  // Owns the padded buffer for the lifetime of this call; from_blob below
  // borrows it without copying.
  padded_wav_.assign(static_cast<size_t>(n_padded), 0.0f);
  std::memcpy(padded_wav_.data(), wav.samples.data(),
              static_cast<size_t>(n_valid) * sizeof(float));

  auto wav_tensor = ::executorch::extension::from_blob(
      padded_wav_.data(), {1, static_cast<SizesType>(n_padded)},
      ::executorch::aten::ScalarType::Float);

  // 0-d int64 scalar. The PTE was exported with
  //   sample_num_valid = torch.tensor(..., dtype=torch.long)
  // which traces to a 0-rank Long tensor.
  num_valid_scalar_ = n_valid;
  auto num_valid_tensor = ::executorch::extension::from_blob(
      &num_valid_scalar_, {}, ::executorch::aten::ScalarType::Long);

  std::vector<EValue> args = {EValue(*wav_tensor), EValue(*num_valid_tensor)};
  auto exec_result = ET_UNWRAP(module_->execute(kAudioEncoderMethod, args));
  ET_CHECK_OR_RETURN_ERROR(!exec_result.empty(), InvalidState,
                           "audio_encoder returned no outputs");
  auto audio_tensor = exec_result[0].toTensor();
  ET_CHECK_OR_RETURN_ERROR(audio_tensor.dim() == 3, InvalidState,
                           "audio_encoder output rank=%zd, expected 3",
                           audio_tensor.dim());
  last_token_count_ = static_cast<int32_t>(audio_tensor.size(1));
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "AudioEncoder: valid_samples=", n_valid,
                    " padded_samples=", n_padded, " k_blocks=", k_blocks,
                    " audio_tokens=", last_token_count_);
  return exec_result[0];
}

} // namespace executorch::extension::llm
