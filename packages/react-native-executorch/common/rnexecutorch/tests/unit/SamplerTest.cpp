/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <runner/sampler.h>
#include <vector>

using namespace executorch::extension::llm;

// Helper: run sampler N times, count how often each index is picked.
template <typename T>
std::vector<int> sampleMany(Sampler &s, std::vector<T> logits,
                            const std::vector<uint64_t> &recent, int n) {
  std::vector<int> counts(logits.size(), 0);
  for (int i = 0; i < n; ++i) {
    std::vector<T> copy = logits;
    counts[s.sample(copy.data(), recent)]++;
  }
  return counts;
}

// 1. Repetition penalty on positive logit: token 0 should be sampled less.
TEST(SamplerTest, RepetitionPenaltyReducesPositiveLogit) {
  Sampler s(2, 1.0f, 1.0f, 0, 0.0f, 1.3f);
  std::vector<float> logits = {1.0f, 1.0f};
  std::vector<uint64_t> recent = {0};
  auto counts = sampleMany(s, logits, recent, 2000);
  EXPECT_LT(counts[0], 1200);
}

// 2. Repetition penalty on negative logit: penalised token should appear even
// less.
TEST(SamplerTest, RepetitionPenaltyMultipliesNegativeLogit) {
  Sampler s(2, 1.0f, 1.0f, 0, 0.0f, 1.5f);
  std::vector<float> logits = {0.0f, -1.0f};
  std::vector<uint64_t> recent = {1};
  auto counts = sampleMany(s, logits, recent, 2000);
  EXPECT_LT(counts[1], 200);
}

// 3. No recent tokens — penalty has no effect.
TEST(SamplerTest, RepetitionPenaltyNoRecentTokensHasNoEffect) {
  Sampler baseline(2, 1.0f, 1.0f, 0, 0.0f, 1.0f);
  Sampler penalised(2, 1.0f, 1.0f, 0, 0.0f, 2.0f);
  std::vector<float> logits_b = {1.0f, 1.0f};
  std::vector<float> logits_p = {1.0f, 1.0f};
  std::vector<uint64_t> recent = {};
  auto cb = sampleMany(baseline, logits_b, recent, 2000);
  auto cp = sampleMany(penalised, logits_p, recent, 2000);
  EXPECT_NEAR(cb[0], cp[0], 300);
}

// 4. Min-p truncation: token with very low probability is excluded.
TEST(SamplerTest, MinPFiltersTailTokens) {
  Sampler s(3, 1.0f, 1.0f, 0, 0.1f, 1.0f);
  std::vector<float> logits = {5.0f, -5.0f, -5.0f};
  std::vector<uint64_t> recent = {};
  auto counts = sampleMany(s, logits, recent, 1000);
  EXPECT_EQ(counts[1], 0);
  EXPECT_EQ(counts[2], 0);
  EXPECT_EQ(counts[0], 1000);
}

// 5. Min-p = 0 disables filtering.
TEST(SamplerTest, MinPZeroDisablesFiltering) {
  Sampler s(3, 0.0f, 1.0f, 0, 0.0f, 1.0f);
  std::vector<float> logits = {1.0f, -1000.0f, -1000.0f};
  std::vector<uint64_t> recent = {};
  EXPECT_EQ(s.sample(logits.data(), recent), 0);
}

// 6. Min-p + top-p stacked.
TEST(SamplerTest, MinPAndToppStack) {
  Sampler s(4, 1.0f, 0.5f, 0, 0.2f, 1.0f);
  std::vector<float> logits = {5.0f, 2.0f, -2.0f, -5.0f};
  std::vector<uint64_t> recent = {};
  auto counts = sampleMany(s, logits, recent, 2000);
  EXPECT_EQ(counts[2], 0);
  EXPECT_EQ(counts[3], 0);
}
