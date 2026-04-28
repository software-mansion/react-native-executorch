/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <cctype>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <memory>
#include <utility>
#include <vector>
#ifdef USE_ATEN_LIB
#include <torch/torch.h>
#endif

#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <executorch/runtime/platform/compiler.h>

namespace executorch {
namespace extension {
namespace llm {
// A simple llama2 sampler.

inline constexpr auto kTopp = 0.9f;

template <typename T> struct ProbIndex {
  T prob;
  int32_t index;
}; // struct used when sorting probabilities during top-p sampling

class Sampler {
public:
  Sampler(int32_t vocab_size, float temperature, float topp,
          unsigned long long rng_seed, float min_p = 0.0f,
          float repetition_penalty = 1.0f);

  Sampler(int32_t vocab_size, float temperature, float topp);

  template <typename T> int32_t sample(T *logits);

  template <typename T>
  int32_t sample(T *logits, const std::vector<uint64_t> &recent_tokens);

private:
  template <typename T> int32_t sample_topp(T *probabilities, float coin);
  template <typename T> int32_t sample_mult(T *probabilities, float coin);
  template <typename T> int32_t sample_argmax(T *probabilities);

  template <typename T>
  inline void apply_temperature(T *logits, int32_t vocab_size) {
    for (std::size_t i = 0; std::cmp_less(i, vocab_size); ++i) {
      logits[i] =
          static_cast<T>(static_cast<float>(logits[i]) * inv_temperature_);
    }
  }

  template <typename T>
  inline void
  apply_repetition_penalty(T *logits, int32_t vocab_size,
                           const std::vector<uint64_t> &recent_tokens) {
    if (repetition_penalty_ == 1.0f || recent_tokens.empty())
      return;
    for (uint64_t id : recent_tokens) {
      if (!std::cmp_less(id, vocab_size)) {
        continue;
      }
      T &val = logits[id];
      if (val > T(0)) {
        val = static_cast<T>(static_cast<float>(val) / repetition_penalty_);
      } else {
        val = static_cast<T>(static_cast<float>(val) * repetition_penalty_);
      }
    }
  }

  template <typename T>
  inline void apply_min_p(T *probabilities, int32_t vocab_size) {
    if (min_p_ <= 0.0f) {
      return;
    }
    T max_prob = *std::max_element(probabilities, probabilities + vocab_size);
    T threshold = static_cast<T>(min_p_ * static_cast<float>(max_prob));
    T sum = T(0);
    for (std::size_t i = 0; std::cmp_less(i, vocab_size); ++i) {
      if (probabilities[i] < threshold) {
        probabilities[i] = T(0);
      } else {
        sum += probabilities[i];
      }
    }
    if (sum > T(0)) {
      for (std::size_t i = 0; std::cmp_less(i, vocab_size); ++i) {
        probabilities[i] /= sum;
      }
    }
  }

private:
  int32_t vocab_size_;
  // reciprocal of temperature, or 0 if temperature == 0.
  float inv_temperature_;
  float topp_;
  float min_p_;
  float repetition_penalty_;
  unsigned long long rng_state_;
};

} // namespace llm
} // namespace extension
} // namespace executorch

namespace torch {
namespace executor {
// TODO(T197294990): Remove these deprecated aliases once all users have moved
// to the new `::executorch` namespaces.
using ::executorch::extension::llm::ProbIndex;
using ::executorch::extension::llm::Sampler;
} // namespace executor
} // namespace torch

namespace executorch::llm {
// TODO(T197294990): Remove these deprecated aliases once all users have moved
// to the new `::executorch::extension::llm` namespaces.
using ::executorch::extension::llm::kTopp;
} // namespace executorch::llm
