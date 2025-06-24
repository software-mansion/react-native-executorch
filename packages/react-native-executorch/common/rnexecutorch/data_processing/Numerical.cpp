#include "Numerical.h"

#include <algorithm>
#include <cmath>
#include <numeric>

namespace rnexecutorch::numerical {
void softmax(std::vector<float> &v) {
  float max = *std::max_element(v.begin(), v.end());

  float sum = 0.0f;
  for (float &x : v) {
    x = std::exp(x - max);
    sum += x;
  }
  for (float &x : v) {
    x /= sum;
  }
}

void normalize(std::span<float> span) {
  auto sum = 0.0f;
  for (const auto &val : span) {
    sum += val * val;
  }

  // Preventing divison by 0
  float norm = std::max(std::sqrt(sum), 1e-9f);
  for (auto &val : span) {
    val /= norm;
  }
}
} // namespace rnexecutorch::numerical