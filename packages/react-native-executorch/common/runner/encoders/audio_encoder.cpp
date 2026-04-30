// common/runner/encoders/audio_encoder.cpp
#include "audio_encoder.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
#include <runner/constants.h>

#include <executorch/extension/tensor/tensor.h>

#include <cmath>
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

namespace executorch::extension::llm {

using ::executorch::aten::SizesType;
using ::executorch::runtime::Error;
using ::executorch::runtime::EValue;
using ::executorch::runtime::Result;

namespace {
// Matches AUDIO_SAMPLES_PER_BLOCK in gemma_export/experiments_vulkan/
// op_bisect/iter201_mm_4method_dynaudio_prefill2048_export.py.
// The PTE's audio_samples dim was exported as `7680 * audio_blocks`.
constexpr int32_t kSamplesPerBlock = 7680;
// k ∈ [kAudioBlockKMin, kAudioBlockKMax] from MODEL_INTERFACE.md §6.
// k=62 == 29.76 s @ 16 kHz is the SDPA mask + rel-shift bake point.
constexpr int64_t kAudioBlockKMin = 1;
constexpr int64_t kAudioBlockKMax = 62;
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
  ET_CHECK_OR_RETURN_ERROR(
      k_blocks >= kAudioBlockKMin && k_blocks <= kAudioBlockKMax,
      InvalidArgument,
      "AudioEncoder: waveform of %lld samples needs k_blocks=%lld; "
      "audio_encoder accepts k in [%lld, %lld] (block=%d samples; max %.2f s "
      "@ 16 kHz)",
      static_cast<long long>(n_valid), static_cast<long long>(k_blocks),
      static_cast<long long>(kAudioBlockKMin),
      static_cast<long long>(kAudioBlockKMax),
      static_cast<int>(kSamplesPerBlock),
      static_cast<double>(kSamplesPerBlock) *
          static_cast<double>(kAudioBlockKMax) / 16000.0);
  const int64_t n_padded = k_blocks * kSamplesPerBlock;

  // Own the padded waveform for the lifetime of this call; from_blob below
  // borrows without copying. The current export takes
  //   forward(waveform[1, 7680*k] fp32, num_blocks: int64 scalar)
  // — input 1 is a rank-0 Long telling the encoder how many of the K_MAX
  // blocks contain real PCM. Passing a 2-d mask here trips "Attempted to
  // change tensor rank: old=0, new=2".
  padded_wav_.assign(static_cast<size_t>(n_padded), 0.0f);
  std::memcpy(padded_wav_.data(), wav.samples.data(),
              static_cast<size_t>(n_valid) * sizeof(float));

  num_blocks_scalar_ = k_blocks;

  auto wav_tensor = ::executorch::extension::from_blob(
      padded_wav_.data(), {1, static_cast<SizesType>(n_padded)},
      ::executorch::aten::ScalarType::Float);

  auto num_blocks_tensor = ::executorch::extension::from_blob(
      &num_blocks_scalar_, {}, ::executorch::aten::ScalarType::Long);

  std::vector<EValue> args = {EValue(*wav_tensor), EValue(*num_blocks_tensor)};
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
