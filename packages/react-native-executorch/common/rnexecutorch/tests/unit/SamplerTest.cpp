/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <runner/irunner.h>
#include <runner/sampler.h>
#include <vector>

using namespace executorch::extension::llm;

// Helper: run sampler N times, count how often each index is picked.
template <typename T>
std::vector<int> sampleMany(Sampler &s, std::vector<T> logits, const std::vector<uint64_t> &recent,
                            int n) {
  std::vector<int> counts(logits.size(), 0);
  for (int i = 0; i < n; ++i) {
    std::vector<T> copy = logits;
    counts[s.sample(copy.data(), recent)]++;
  }
  return counts;
}

// 1. Repetition penalty on positive logit: token 0 should be sampled less.
TEST(SamplerTest, RepetitionPenaltyReducesPositiveLogit) {
  Sampler s(2, {.temperature = 1.0f, .topp = 1.0f, .repetition_penalty = 1.3f});
  std::vector<float> logits = {1.0f, 1.0f};
  std::vector<uint64_t> recent = {0};
  auto counts = sampleMany(s, logits, recent, 2000);
  EXPECT_LT(counts[0], 1200);
}

// 2. Repetition penalty on negative logit: multiplying a negative logit by the
// penalty makes it more negative, so the penalised token is sampled strictly
// less often than without the penalty. Compare against an unpenalised baseline
// rather than a fixed threshold: with penalty 1.5 the penalised logit is
// -1.0 * 1.5 = -1.5, giving P(token 1) = e^-1.5 / (1 + e^-1.5) ≈ 0.18 (~365 of
// 2000) versus the baseline e^-1 / (1 + e^-1) ≈ 0.27 (~538). A static "< 200"
// bound would be mathematically unreachable at this penalty.
TEST(SamplerTest, RepetitionPenaltyMultipliesNegativeLogit) {
  Sampler baseline(2, {.temperature = 1.0f, .topp = 1.0f, .repetition_penalty = 1.0f});
  Sampler penalised(2, {.temperature = 1.0f, .topp = 1.0f, .repetition_penalty = 1.5f});
  std::vector<float> logits_b = {0.0f, -1.0f};
  std::vector<float> logits_p = {0.0f, -1.0f};
  std::vector<uint64_t> recent = {1};
  auto cb = sampleMany(baseline, logits_b, recent, 2000);
  auto cp = sampleMany(penalised, logits_p, recent, 2000);
  EXPECT_LT(cp[1], cb[1]);
}

// 3. No recent tokens — penalty has no effect.
TEST(SamplerTest, RepetitionPenaltyNoRecentTokensHasNoEffect) {
  Sampler baseline(2, {.temperature = 1.0f, .topp = 1.0f, .repetition_penalty = 1.0f});
  Sampler penalised(2, {.temperature = 1.0f, .topp = 1.0f, .repetition_penalty = 2.0f});
  std::vector<float> logits_b = {1.0f, 1.0f};
  std::vector<float> logits_p = {1.0f, 1.0f};
  std::vector<uint64_t> recent = {};
  auto cb = sampleMany(baseline, logits_b, recent, 2000);
  auto cp = sampleMany(penalised, logits_p, recent, 2000);
  EXPECT_NEAR(cb[0], cp[0], 300);
}

// 4. Min-p truncation: token with very low probability is excluded.
TEST(SamplerTest, MinPFiltersTailTokens) {
  Sampler s(3, {.temperature = 1.0f, .topp = 1.0f, .min_p = 0.1f});
  std::vector<float> logits = {5.0f, -5.0f, -5.0f};
  std::vector<uint64_t> recent = {};
  auto counts = sampleMany(s, logits, recent, 1000);
  EXPECT_EQ(counts[1], 0);
  EXPECT_EQ(counts[2], 0);
  EXPECT_EQ(counts[0], 1000);
}

// 5. Min-p = 0 disables filtering.
TEST(SamplerTest, MinPZeroDisablesFiltering) {
  Sampler s(3, {.temperature = 0.0f, .topp = 1.0f});
  std::vector<float> logits = {1.0f, -1000.0f, -1000.0f};
  std::vector<uint64_t> recent = {};
  EXPECT_EQ(s.sample(logits.data(), recent), 0);
}

// 6. Min-p + top-p stacked.
TEST(SamplerTest, MinPAndToppStack) {
  Sampler s(4, {.temperature = 1.0f, .topp = 0.5f, .min_p = 0.2f});
  std::vector<float> logits = {5.0f, 2.0f, -2.0f, -5.0f};
  std::vector<uint64_t> recent = {};
  auto counts = sampleMany(s, logits, recent, 2000);
  EXPECT_EQ(counts[2], 0);
  EXPECT_EQ(counts[3], 0);
}
