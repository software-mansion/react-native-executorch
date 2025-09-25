#pragma once

#include <memory>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include <rnexecutorch/jsi/OwningArrayBuffer.h>

#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>

namespace rnexecutorch {
namespace models::text_to_image {
using namespace facebook;

class Encoder final {
public:
  explicit Encoder(const std::string &tokenizerSource,
                   const std::string &encoderSource,
                   std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<float> generate(std::string input);
  size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<embeddings::TextEmbeddings> encoder;
};
} // namespace models::text_to_image
} // namespace rnexecutorch
