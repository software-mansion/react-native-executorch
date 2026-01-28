// Stub implementations for JSI and other symbols to satisfy the linker
// These are never actually called in tests

#include <ReactCommon/CallInvoker.h>
#include <cstddef>
#include <functional>
#include <jsi/jsi.h>
#include <string>
#include <vector>

namespace facebook::jsi {

// MutableBuffer destructor - needed by OwningArrayBuffer
MutableBuffer::~MutableBuffer() {}
Value::~Value() {}
Value::Value(Value &&other) noexcept {}
} // namespace facebook::jsi

namespace facebook::react {

// Needed by LLM test
class MockCallInvoker : public CallInvoker {
public:
  void invokeAsync(CallFunc &&func) noexcept override {}

  void invokeSync(CallFunc &&func) override {}
};

} // namespace facebook::react

namespace rnexecutorch {

// Stub for fetchUrlFunc - used by ImageProcessing for remote URLs
// Tests only use local files, so this is never called
using FetchUrlFunc_t = std::function<std::vector<std::byte>(std::string)>;
FetchUrlFunc_t fetchUrlFunc = [](std::string) -> std::vector<std::byte> {
  return {};
};

// Global mock call invoker for tests
std::shared_ptr<facebook::react::CallInvoker> createMockCallInvoker() {
  return std::make_shared<facebook::react::MockCallInvoker>();
}

} // namespace rnexecutorch
