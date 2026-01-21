// Stub implementations for JSI and other symbols to satisfy the linker
// These are never actually called in tests

#include <cstddef>
#include <functional>
#include <jsi/jsi.h>
#include <string>
#include <vector>

namespace facebook::jsi {

// MutableBuffer destructor - needed by OwningArrayBuffer
// Don't stub Runtime - it has too many virtual methods
MutableBuffer::~MutableBuffer() {}
Value::~Value() {}
Value::Value(Value &&other) noexcept {}
} // namespace facebook::jsi

namespace rnexecutorch {

// Stub for fetchUrlFunc - used by ImageProcessing for remote URLs
// Tests only use local files, so this is never called
using FetchUrlFunc_t = std::function<std::vector<std::byte>(std::string)>;
FetchUrlFunc_t fetchUrlFunc = [](std::string) -> std::vector<std::byte> {
  return {};
};

} // namespace rnexecutorch
