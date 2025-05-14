#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch {

using namespace facebook;

class OwningArrayBuffer : public jsi::MutableBuffer {
public:
  OwningArrayBuffer(const size_t size) : size_(size) {
    data_ = new uint8_t[size];
  }
  ~OwningArrayBuffer() override { delete[] data_; }

  OwningArrayBuffer(const OwningArrayBuffer &) = delete;
  OwningArrayBuffer(OwningArrayBuffer &&) = delete;
  OwningArrayBuffer &operator=(const OwningArrayBuffer &) = delete;
  OwningArrayBuffer &operator=(OwningArrayBuffer &&) = delete;

  [[nodiscard]] size_t size() const override { return size_; }
  uint8_t *data() override { return data_; }

private:
  uint8_t *data_;
  const size_t size_;
};

} // namespace rnexecutorch