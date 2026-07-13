#include "VectorEstimator.h"
#include "Constants.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

#include <algorithm>
#include <cmath>
#include <cstring>

namespace rnexecutorch::models::text_to_speech::supertonic {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;

VectorEstimator::VectorEstimator(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto shapes = getAllInputShapes("forward");
  if (shapes.empty()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::UnknownError,
        "[Supertonic::VectorEstimator] 'forward' method not found");
  }

  CHECK_SIZE(shapes, 7);
}

VectorEstimator::Result
VectorEstimator::generate(std::span<float> textEmb, int32_t textEmbLen,
                          std::span<float> styleTtl, std::span<float> mask,
                          int32_t tLen, float durationSec,
                          int32_t totalSteps) const {
  // How many waveform samples each latent frame covers and how many
  // frames we need for the predicted duration.
  const int64_t chunk = constants::kSamplesPerLatentFrame;
  const auto sr = static_cast<double>(constants::kSamplingRate);
  const auto wavLen = static_cast<int64_t>(durationSec * sr);
  size_t L = static_cast<size_t>(std::ceil(durationSec * sr / chunk));
  L = std::clamp<size_t>(L, 1, constants::kMaxLatentFrames);
  const int32_t channels = constants::kLatentChannels;
  const int32_t Li = static_cast<int32_t>(L);
  const size_t latentSize =
      static_cast<size_t>(channels) * static_cast<size_t>(L);

  // Only the frames that actually produce audio samples are valid;
  // the remainder is zero-padded for the static model shape.
  const size_t latentValid =
      std::min<size_t>(static_cast<size_t>((wavLen + chunk - 1) / chunk),
                       static_cast<size_t>(L));

  // Mask to silence invalid latent frames during the flow loop.
  std::vector<float> latentMask(static_cast<size_t>(L), 0.0F);
  std::fill(latentMask.begin(), latentMask.begin() + latentValid, 1.0F);

  // Seed the latent space with masked Gaussian noise — the flow-matching
  // process will iteratively transform this into a structured latent.
  std::normal_distribution<float> gauss(0.0F, 1.0F);
  std::vector<float> xt(latentSize);
  for (int32_t c = 0; c < channels; ++c) {
    for (int32_t i = 0; i < Li; ++i) {
      xt[static_cast<size_t>(c) * static_cast<size_t>(L) +
         static_cast<size_t>(i)] =
          gauss(rng_) * latentMask[static_cast<size_t>(i)];
    }
  }

  // Tensors that stay constant across the flow loop.
  auto xtTensor =
      make_tensor_ptr({1, channels, Li}, xt.data(), ScalarType::Float);
  auto textEmbTensor = make_tensor_ptr({1, constants::kTextEmbDim, textEmbLen},
                                       textEmb.data(), ScalarType::Float);
  auto styleTtlTensor =
      make_tensor_ptr({1, constants::kStyleTtlTokens, constants::kStyleTtlDim},
                      styleTtl.data(), ScalarType::Float);
  auto maskTensor =
      make_tensor_ptr({1, 1, tLen}, mask.data(), ScalarType::Float);
  auto latentMaskTensor =
      make_tensor_ptr({1, 1, Li}, latentMask.data(), ScalarType::Float);

  // Euler integration: starting from pure noise at step 0, the vector
  // estimator predicts the velocity field at each step, and the latent
  // is updated in place until we reach the final step.
  float totalF = static_cast<float>(totalSteps);
  auto totalTensor = make_tensor_ptr({1}, &totalF, ScalarType::Float);
  for (int32_t step = 0; step < totalSteps; ++step) {
    float curF = static_cast<float>(step);
    auto curTensor = make_tensor_ptr({1}, &curF, ScalarType::Float);
    auto results = forward({xtTensor, textEmbTensor, styleTtlTensor, maskTensor,
                            latentMaskTensor, curTensor, totalTensor});
    if (!results.ok()) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::InvalidModelOutput,
          "[Supertonic::VectorEstimator] forward failed, error: " +
              std::to_string(static_cast<uint32_t>(results.error())));
    }
    auto out = results->at(0).toTensor();
    std::memcpy(xt.data(), out.const_data_ptr<float>(),
                xt.size() * sizeof(float));
  }

  return {std::move(xt), Li};
}

} // namespace rnexecutorch::models::text_to_speech::supertonic
