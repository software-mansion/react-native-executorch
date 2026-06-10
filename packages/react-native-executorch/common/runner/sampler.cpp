/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This is a modified version of https://github.com/karpathy/llama2.c.git
// @lint-ignore-every LICENSELINT
/**
 * MIT License
 *
 * Copyright (c) 2023 Andrej
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include "sampler.h"
#include <algorithm>
#include <ctime>
#include <limits>
#include <vector>

namespace executorch {
namespace extension {
namespace llm {

// sampler stuff
template <typename T> int32_t Sampler::sample_argmax(T *probabilities) {
  // return the index that has the highest probability
  int max_i = 0;
  T max_p = probabilities[0];
  for (size_t i = 1; i < vocab_size_; i++) {
    if (probabilities[i] > max_p) {
      max_i = i;
      max_p = probabilities[i];
    }
  }
  return max_i;
}

template <typename T>
int32_t Sampler::sample_mult(T *probabilities, float coin) {
  // sample index from probabilities (they must sum to 1!)
  // coin is a random number in [0, 1), usually from random_f32()
  T cdf = 0.0;
  for (size_t i = 0; i < vocab_size_; i++) {
    cdf += probabilities[i];
    if (coin < cdf) {
      return i;
    }
  }
  return vocab_size_ - 1; // in case of rounding errors
}

template <typename T>
int32_t Sampler::sample_topp(T *probabilities, float coin) {
  // top-p sampling (or "nucleus sampling") samples from the smallest set of
  // tokens that exceed probability topp. This way we never sample tokens that
  // have very low probabilities and are less likely to go "off the rails".
  // coin is a random number in [0, 1), usually from random_f32()
  int n = vocab_size_;
  int n0 = 0;
  // quicksort indices in descending order of probabilities
  // values smaller than (1 - topp) / (n - 1) cannot be part of the result
  // so for efficiency we crop these out as candidates before sorting
  std::unique_ptr<ProbIndex<T>[]> probindex =
      std::make_unique<ProbIndex<T>[]>(vocab_size_);

  const float cutoff = (1.0f - topp_) / (n - 1);
  for (size_t i = 0; i < n; i++) {
    if (probabilities[i] >= cutoff) {
      probindex[n0].index = i;
      probindex[n0].prob = probabilities[i];
      n0++;
    }
  }

  std::sort(probindex.get(), probindex.get() + n0,
            [](const ProbIndex<T> &a, const ProbIndex<T> &b) {
              return a.prob > b.prob;
            });

  // truncate the list where cumulative probability exceeds topp
  T cumulative_prob = 0;
  int last_idx = n0 - 1;
  for (size_t i = 0; i < n0; i++) {
    cumulative_prob += probindex[i].prob;
    if (static_cast<float>(cumulative_prob) > topp_) {
      last_idx = i;
      break;
    }
  }

  // sample from the truncated list
  float r = coin * static_cast<float>(cumulative_prob);
  T cdf = 0;
  for (size_t i = 0; i <= last_idx; i++) {
    cdf += probindex[i].prob;
    if (r < static_cast<float>(cdf)) {
      return probindex[i].index;
    }
  }
  return probindex[last_idx].index;
}

// Mask logits outside the top-k by rank to -inf. Ties at the k-th boundary
// are kept (matches HuggingFace TopKLogitsWarper).
template <typename T> void Sampler::mask_topk(T *logits) {
  if (topk_ <= 0 || topk_ >= vocab_size_) {
    return;
  }
  // Partial-select the (topk_-th largest) threshold using nth_element on a
  // copy of logits; O(n) average.
  std::vector<T> scratch(logits, logits + vocab_size_);
  std::nth_element(scratch.begin(), scratch.begin() + (topk_ - 1),
                   scratch.end(), std::greater<T>());
  const T threshold = scratch[topk_ - 1];
  const T neg_inf = std::numeric_limits<T>::lowest();
  for (size_t i = 0; i < vocab_size_; i++) {
    if (logits[i] < threshold) {
      logits[i] = neg_inf;
    }
  }
}

// Mask logits whose softmax-prob falls outside the top-p nucleus to -inf.
// Keeps the token that crosses the threshold (HuggingFace convention).
template <typename T> void Sampler::mask_topp(T *logits) {
  if (topp_ <= 0.0f || topp_ >= 1.0f) {
    return;
  }
  // Softmax into a scratch probs[] (do not mutate logits yet).
  T max_val = logits[0];
  for (size_t i = 1; i < vocab_size_; i++) {
    if (logits[i] > max_val) {
      max_val = logits[i];
    }
  }
  std::unique_ptr<ProbIndex<T>[]> probindex =
      std::make_unique<ProbIndex<T>[]>(vocab_size_);
  T sum = 0;
  for (size_t i = 0; i < vocab_size_; i++) {
    T e = static_cast<T>(std::expf(static_cast<float>(logits[i] - max_val)));
    probindex[i].prob = e;
    probindex[i].index = i;
    sum += e;
  }
  if (sum <= T(0)) {
    return;
  }
  for (size_t i = 0; i < vocab_size_; i++) {
    probindex[i].prob = probindex[i].prob / sum;
  }
  std::sort(probindex.get(), probindex.get() + vocab_size_,
            [](const ProbIndex<T> &a, const ProbIndex<T> &b) {
              return a.prob > b.prob;
            });

  // Find the smallest prefix whose cumulative probability >= topp_.
  T cumulative = 0;
  int last_idx = vocab_size_ - 1;
  for (size_t i = 0; i < vocab_size_; i++) {
    cumulative += probindex[i].prob;
    if (static_cast<float>(cumulative) >= topp_) {
      last_idx = i;
      break;
    }
  }
  // Mark kept indices, then -inf the rest.
  std::vector<bool> keep(vocab_size_, false);
  for (size_t i = 0; i <= last_idx; i++) {
    keep[probindex[i].index] = true;
  }
  const T neg_inf = std::numeric_limits<T>::lowest();
  for (size_t i = 0; i < vocab_size_; i++) {
    if (!keep[i]) {
      logits[i] = neg_inf;
    }
  }
}

Sampler::Sampler(int32_t vocab_size, GenerationConfig config,
                 unsigned long long rng_seed)
    : vocab_size_(vocab_size),
      inv_temperature_(
          (config.temperature != 0.0f) ? (1.0f / config.temperature) : 0.0f),
      topp_(config.topp), min_p_(config.min_p),
      repetition_penalty_(config.repetition_penalty), topk_(config.topk),
      rng_state_(rng_seed) {}

Sampler::Sampler(int32_t vocab_size, GenerationConfig config)
    : Sampler(vocab_size, config, std::time(nullptr)) {}

template <typename T> static void softmax(T *x, int size) {
  // find max value (for numerical stability)
  T max_val = x[0];
  for (size_t i = 1; i < size; i++) {
    if (x[i] > max_val) {
      max_val = x[i];
    }
  }
  // exp and sum
  T sum = 0;
  for (size_t i = 0; i < size; i++) {
    x[i] = expf(x[i] - max_val);
    sum += x[i];
  }
  // normalize
  for (size_t i = 0; i < size; i++) {
    x[i] /= sum;
  }
}

static unsigned int random_u32(unsigned long long *state) {
  // xorshift rng: https://en.wikipedia.org/wiki/Xorshift#xorshift.2A
  *state ^= *state >> 12;
  *state ^= *state << 25;
  *state ^= *state >> 27;
  return (*state * 0x2545F4914F6CDD1Dull) >> 32;
}

static float random_f32(unsigned long long *state) { // random float32 in [0,1)
  return (random_u32(state) >> 8) / 16777216.0f;
}

template <typename T>
int32_t Sampler::sample(T *logits, const std::vector<uint64_t> &recent_tokens) {
  // sample the token given the logits and some hyperparameters
  int next;
  if (inv_temperature_ == 0.0f) {
    // greedy argmax sampling: take the token with the highest probability
    next = sample_argmax(logits);
  } else {
    // 1. apply repetition penalty to raw logits (pre-softmax)
    apply_repetition_penalty(logits, vocab_size_, recent_tokens);
    // 2. apply the temperature to the logits
    apply_temperature(logits, vocab_size_);
    // 3. mask out logits outside top-k by rank (pre-softmax, becomes 0 mass)
    mask_topk(logits);
    // 4. mask out logits outside top-p by rank (pre-softmax)
    mask_topp(logits);
    // 5. apply softmax to the logits to get the probabilities for next token
    softmax(logits, vocab_size_);
    // 6. apply min_p truncation
    apply_min_p(logits, vocab_size_);
    // flip a (float) coin (this is our source of entropy for sampling)
    float coin = random_f32(&rng_state_);
    // 7. we sample from this distribution to get the next token
    next = sample_mult(logits, coin);
  }
  return next;
}

template <typename T> int32_t Sampler::sample(T *logits) {
  return sample(logits, {});
}

template int32_t Sampler::sample<float>(float *logits);
template int32_t Sampler::sample<uint16_t>(uint16_t *logits);
template int32_t
Sampler::sample<executorch::aten::Half>(executorch::aten::Half *logits);
template int32_t
Sampler::sample<executorch::aten::BFloat16>(executorch::aten::BFloat16 *logits);

template int32_t Sampler::sample<float>(float *logits,
                                        const std::vector<uint64_t> &);
template int32_t Sampler::sample<uint16_t>(uint16_t *logits,
                                           const std::vector<uint64_t> &);
template int32_t
Sampler::sample<executorch::aten::Half>(executorch::aten::Half *logits,
                                        const std::vector<uint64_t> &);
template int32_t
Sampler::sample<executorch::aten::BFloat16>(executorch::aten::BFloat16 *logits,
                                            const std::vector<uint64_t> &);

} // namespace llm
} // namespace extension
} // namespace executorch
