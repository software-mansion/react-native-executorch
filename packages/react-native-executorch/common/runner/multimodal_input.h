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

#include <runner/image.h>
#include <string>
#include <variant>
#include <vector>

namespace executorch {
namespace extension {
namespace llm {

class MultimodalInput {
public:
  explicit MultimodalInput(const std::string &text) : data_(text) {}
  explicit MultimodalInput(std::string &&text) : data_(std::move(text)) {}
  explicit MultimodalInput(const std::vector<uint64_t> &tokens)
      : data_(tokens) {}
  explicit MultimodalInput(std::vector<uint64_t> &&tokens)
      : data_(std::move(tokens)) {}
  explicit MultimodalInput(const Image &image) : data_(image) {}
  explicit MultimodalInput(Image &&image) : data_(std::move(image)) {}

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
    return std::holds_alternative<Image>(data_);
  }

  const std::string &get_text() const & { return std::get<std::string>(data_); }
  const std::vector<uint64_t> &get_tokens() const & {
    return std::get<std::vector<uint64_t>>(data_);
  }
  const Image &get_image() const & { return std::get<Image>(data_); }

private:
  std::variant<std::string, std::vector<uint64_t>, Image> data_;
};

inline MultimodalInput make_text_input(const std::string &text) noexcept {
  return MultimodalInput(text);
}
inline MultimodalInput make_text_input(std::string &&text) noexcept {
  return MultimodalInput(std::move(text));
}
inline MultimodalInput make_image_input(const Image &image) noexcept {
  return MultimodalInput(image);
}
inline MultimodalInput make_image_input(Image &&image) noexcept {
  return MultimodalInput(std::move(image));
}

} // namespace llm
} // namespace extension
} // namespace executorch
