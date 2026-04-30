#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>

#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/privacy_filter/Types.h>
#include <rnexecutorch/models/privacy_filter/Viterbi.h>

namespace rnexecutorch {
namespace models::privacy_filter {
using namespace facebook;

class PrivacyFilter final : public BaseModel {
public:
  PrivacyFilter(const std::string &modelSource,
                const std::string &tokenizerSource,
                std::vector<std::string> labelNames,
                std::vector<float> viterbiBiases,
                std::shared_ptr<react::CallInvoker> callInvoker);

  [[nodiscard("Registered non-void function")]] std::vector<types::PiiEntity>
  generate(std::string text);

  void unload() noexcept;

private:
  void runWindow(std::vector<int64_t> &paddedInputIds,
                 std::vector<int64_t> &paddedAttentionMask, int32_t absStart,
                 int32_t validLen, int32_t writeFromOffset,
                 int32_t writeToOffset, std::vector<int32_t> &outLabels);

  std::string labelEntityType(int32_t labelId) const;

  mutable std::mutex inference_mutex_;
  std::unique_ptr<TokenizerModule> tokenizer_;
  std::vector<std::string> labelNames_;
  viterbi::Biases biases_;
  viterbi::Grammar grammar_;
  int32_t seqLen_;
};

} // namespace models::privacy_filter

REGISTER_CONSTRUCTOR(models::privacy_filter::PrivacyFilter, std::string,
                     std::string, std::vector<std::string>, std::vector<float>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
