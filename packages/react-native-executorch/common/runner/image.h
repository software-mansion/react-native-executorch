/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ported from executorch/extension/llm/runner/image.h

#pragma once

#include <cstdint>
#include <variant>
#include <vector>

#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/platform/log.h>

namespace executorch {
namespace extension {
namespace llm {

class Image {
public:
  Image() : width_(0), height_(0), channels_(0) {}

  Image(std::vector<uint8_t> &&data, int32_t width, int32_t height,
        int32_t channels)
      : data_(std::move(data)), width_(width), height_(height),
        channels_(channels) {}

  Image(std::vector<float> &&data, int32_t width, int32_t height,
        int32_t channels)
      : data_(std::move(data)), width_(width), height_(height),
        channels_(channels) {}

  int32_t width() const { return width_; }
  int32_t height() const { return height_; }
  int32_t channels() const { return channels_; }

  bool is_uint8() const {
    return std::holds_alternative<std::vector<uint8_t>>(data_);
  }
  bool is_float() const {
    return std::holds_alternative<std::vector<float>>(data_);
  }

  const std::vector<uint8_t> &get_uint8_data() const & {
    return std::get<std::vector<uint8_t>>(data_);
  }
  const std::vector<float> &get_float_data() const & {
    return std::get<std::vector<float>>(data_);
  }
  std::vector<float> &get_float_data() & {
    return std::get<std::vector<float>>(data_);
  }

  ::executorch::runtime::Result<::executorch::extension::TensorPtr>
  toTensor(bool with_batch = false) const {
    std::vector<::executorch::aten::SizesType> sizes = {channels(), height(),
                                                        width()};
    if (with_batch) {
      sizes.insert(sizes.begin(), 1);
    }
    if (is_float()) {
      return ::executorch::extension::from_blob(
          const_cast<float *>(get_float_data().data()), sizes,
          ::executorch::aten::ScalarType::Float);
    } else if (is_uint8()) {
      return ::executorch::extension::from_blob(
          const_cast<uint8_t *>(get_uint8_data().data()), sizes,
          ::executorch::aten::ScalarType::Byte);
    }
    ET_LOG(Error, "Image data is not initialized.");
    return ::executorch::runtime::Error::NotSupported;
  }

private:
  std::variant<std::vector<uint8_t>, std::vector<float>> data_;
  int32_t width_;
  int32_t height_;
  int32_t channels_;
};

} // namespace llm
} // namespace extension
} // namespace executorch
