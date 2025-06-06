#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch {

using namespace facebook;

/**
 * JSI offers the MutableBuffer as an interface for accessing native memory
 * directly from JS. A class inheriting from the MutableBuffer could be used to
 * access memory which is owned by C++ or memory which should be freed once JS
 * is done with it. OwningArrayBuffer is an example of the latter, memory is
 * allocated on creation and freed on deletion. JS holds a pointer to all
 * MutableBuffers via a shared_ptr, so the destructor will be called only when
 * no reference to it is kept. For a handy JS access to the data, MutableBuffers
 * can be inspected via a data view, such as Float32Array. See
 * ImageSegmentation.cpp for an example usage.
 */
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