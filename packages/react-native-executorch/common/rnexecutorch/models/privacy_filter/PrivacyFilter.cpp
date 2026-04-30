#include "PrivacyFilter.h"

#include <algorithm>
#include <cstdint>
#include <ranges>
#include <string>
#include <utility>
#include <vector>

#include <executorch/extension/tensor/tensor_ptr_maker.h>

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch::models::privacy_filter {

using executorch::aten::ScalarType;
using executorch::extension::make_tensor_ptr;
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

namespace {

// o200k tokenizer: <|endoftext|> (id 199999) doubles as pad and eos.
constexpr int64_t kPadTokenId = 199999;

} // namespace

PrivacyFilter::PrivacyFilter(const std::string &modelSource,
                             const std::string &tokenizerSource,
                             std::vector<std::string> labelNames,
                             std::vector<float> viterbiBiases,
                             std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker),
      tokenizer_(
          std::make_unique<TokenizerModule>(tokenizerSource, callInvoker)),
      labelNames_(std::move(labelNames)), seqLen_(0) {
  if (labelNames_.empty()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::UnknownError,
        "PrivacyFilter requires a non-empty labelNames vector "
        "(must include 'O' at index 0).");
  }
  if (viterbiBiases.size() == 6) {
    biases_.backgroundStay = viterbiBiases[0];
    biases_.backgroundToStart = viterbiBiases[1];
    biases_.endToBackground = viterbiBiases[2];
    biases_.endToStart = viterbiBiases[3];
    biases_.insideToContinue = viterbiBiases[4];
    biases_.insideToEnd = viterbiBiases[5];
  }
  auto inputShapes = getAllInputShapes();
  if (inputShapes.empty() || inputShapes[0].size() < 2) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::WrongDimensions,
        "PrivacyFilter: expected forward input shape [1, seq_len].");
  }
  seqLen_ = inputShapes[0][1];
  grammar_ = viterbi::buildGrammar(labelNames_, biases_);
}

std::string PrivacyFilter::labelEntityType(int32_t labelId) const {
  if (labelId <= 0 || std::cmp_greater_equal(labelId, labelNames_.size())) {
    return "";
  }
  const auto &name = labelNames_[static_cast<size_t>(labelId)];
  const auto dashPos = name.find('-');
  if (dashPos == std::string::npos) {
    return "";
  }
  return name.substr(dashPos + 1);
}

void PrivacyFilter::unload() noexcept {
  std::scoped_lock lock(inference_mutex_);
  BaseModel::unload();
}

void PrivacyFilter::runWindow(std::vector<int64_t> &paddedInputIds,
                              std::vector<int64_t> &paddedAttentionMask,
                              int32_t absStart, int32_t validLen,
                              int32_t writeFromOffset, int32_t writeToOffset,
                              std::vector<int32_t> &outLabels) {
  if (validLen <= 0) {
    return;
  }

  std::vector<int32_t> idsShape = {1, seqLen_};
  auto inputIdsTensor =
      make_tensor_ptr(idsShape, paddedInputIds.data(), ScalarType::Long);
  auto attentionMaskTensor =
      make_tensor_ptr(idsShape, paddedAttentionMask.data(), ScalarType::Long);

  auto forwardResult =
      BaseModel::forward({*inputIdsTensor, *attentionMaskTensor});
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }
  auto &out = forwardResult.get();
  if (out.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnknownError,
                            "PrivacyFilter: forward returned no outputs");
  }

  const auto &logitsTensor = out[0].toTensor();
  const float *logits = logitsTensor.const_data_ptr<float>();

  auto path = viterbi::decode(logits, validLen, grammar_);

  const int32_t end = std::min(writeToOffset, validLen);
  std::copy(path.begin() + writeFromOffset, path.begin() + end,
            outLabels.begin() + absStart + writeFromOffset);
}

std::vector<types::PiiEntity> PrivacyFilter::generate(std::string text) {
  std::scoped_lock lock(inference_mutex_);

  if (!module_) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "PrivacyFilter is not loaded");
  }

  auto rawIds = tokenizer_->encode(text);
  const int32_t totalTokens = static_cast<int32_t>(rawIds.size());

  std::vector<int32_t> predictedLabels(static_cast<size_t>(totalTokens), 0);

  const int32_t stride = seqLen_ / 2;
  const int32_t edgeMargin = seqLen_ / 4;
  for (int32_t windowStart = 0; windowStart < totalTokens;
       windowStart += stride) {
    const int32_t validLen = std::min(seqLen_, totalTokens - windowStart);

    std::vector<int64_t> paddedInputIds(static_cast<size_t>(seqLen_),
                                        kPadTokenId);
    std::vector<int64_t> paddedAttentionMask(static_cast<size_t>(seqLen_), 0);
    for (int32_t i = 0; i < validLen; ++i) {
      paddedInputIds[static_cast<size_t>(i)] =
          static_cast<int64_t>(rawIds[static_cast<size_t>(windowStart + i)]);
      paddedAttentionMask[static_cast<size_t>(i)] = 1;
    }

    const bool isFirst = windowStart == 0;
    const bool isLast = windowStart + seqLen_ >= totalTokens;
    int32_t writeFrom = isFirst ? 0 : edgeMargin;
    int32_t writeTo = isLast ? validLen : seqLen_ - edgeMargin;

    runWindow(paddedInputIds, paddedAttentionMask, windowStart, validLen,
              writeFrom, writeTo, predictedLabels);

    if (isLast) {
      break;
    }
  }

  struct Span {
    int32_t start;
    int32_t end; // exclusive
    std::string entity;
  };
  std::vector<Span> spans;
  int32_t i = 0;
  while (i < totalTokens) {
    const auto entity =
        labelEntityType(predictedLabels[static_cast<size_t>(i)]);
    if (entity.empty()) {
      ++i;
      continue;
    }
    int32_t j = i + 1;
    while (j < totalTokens &&
           labelEntityType(predictedLabels[static_cast<size_t>(j)]) == entity) {
      ++j;
    }
    spans.emplace_back(i, j, entity);
    i = j;
  }

  std::vector<types::PiiEntity> entities;
  entities.reserve(spans.size());
  for (const auto &span : spans) {
    std::vector<uint64_t> slice;
    slice.reserve(static_cast<size_t>(span.end - span.start));
    for (int32_t k = span.start; k < span.end; ++k) {
      slice.emplace_back(rawIds[static_cast<size_t>(k)]);
    }
    std::string decoded;
    try {
      decoded = tokenizer_->decode(slice, /*skipSpecialTokens=*/true);
    } catch (...) {
    }
    constexpr auto notSpace = [](unsigned char c) { return !std::isspace(c); };
    auto left = std::ranges::find_if(decoded, notSpace);
    auto right =
        std::ranges::find_if(decoded.rbegin(), decoded.rend(), notSpace).base();
    if (left < right) {
      decoded.assign(left, right);
    } else {
      decoded.clear();
    }

    entities.emplace_back(span.entity, std::move(decoded), span.start,
                          span.end);
  }
  return entities;
}

} // namespace rnexecutorch::models::privacy_filter
