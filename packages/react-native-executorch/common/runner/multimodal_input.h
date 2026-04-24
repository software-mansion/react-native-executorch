/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/multimodal_input.h
// Audio support stripped — only text and image are used by LFM2-VL.

#pragma once

#include <string>
#include <variant>
#include <vector>

namespace executorch::extension::llm {
struct ImagePath {
  std::string path;
};
// In-memory raw audio (fp32, mono). Pattern mirrors SpeechToText: the JS
// layer decodes WAV/MP3 via react-native-audio-api and passes Float32Array
// samples; the PTE has the log-mel frontend baked in, so the runner only
// needs the waveform itself. sample_rate is expected to match the PTE's
// mel-extractor (Gemma4: 16000 Hz).
struct AudioWaveform {
  std::vector<float> samples;
  int32_t sample_rate;
};

class MultimodalInput {
public:
  explicit MultimodalInput(std::string text) : data_(std::move(text)) {}
  explicit MultimodalInput(std::vector<uint64_t> tokens)
      : data_(std::move(tokens)) {}
  explicit MultimodalInput(ImagePath image_path)
      : data_(std::move(image_path)) {}
  explicit MultimodalInput(AudioWaveform audio) : data_(std::move(audio)) {}

  MultimodalInput(const MultimodalInput &) = default;
  MultimodalInput &operator=(const MultimodalInput &) = default;
  MultimodalInput(MultimodalInput &&) noexcept = default;
  MultimodalInput &operator=(MultimodalInput &&) noexcept = default;

  bool is_text() const noexcept {
    return std::holds_alternative<std::string>(data_);
  }
  bool is_tokens() const noexcept {
    return std::holds_alternative<std::vector<uint64_t>>(data_);
  }
  bool is_image() const noexcept {
    return std::holds_alternative<ImagePath>(data_);
  }
  bool is_audio() const noexcept {
    return std::holds_alternative<AudioWaveform>(data_);
  }

  const std::string &get_text() const & { return std::get<std::string>(data_); }
  const std::vector<uint64_t> &get_tokens() const & {
    return std::get<std::vector<uint64_t>>(data_);
  }
  const std::string &get_image_path() const & {
    return std::get<ImagePath>(data_).path;
  }
  const AudioWaveform &get_audio() const & {
    return std::get<AudioWaveform>(data_);
  }

private:
  std::variant<std::string, std::vector<uint64_t>, ImagePath, AudioWaveform>
      data_;
};

inline MultimodalInput make_text_input(const std::string &text) noexcept {
  return MultimodalInput(text);
}
inline MultimodalInput make_text_input(std::string &&text) noexcept {
  return MultimodalInput(std::move(text));
}
inline MultimodalInput make_image_input(std::string path) noexcept {
  return MultimodalInput(ImagePath{std::move(path)});
}
inline MultimodalInput make_audio_input(std::vector<float> samples,
                                        int32_t sample_rate = 16000) noexcept {
  return MultimodalInput(AudioWaveform{std::move(samples), sample_rate});
}

} // namespace executorch::extension::llm
