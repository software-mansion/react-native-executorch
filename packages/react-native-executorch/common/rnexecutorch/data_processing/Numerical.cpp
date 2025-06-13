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
void normalizeVector(std::vector<float> &v) {
  float norm = 0.0;
  for (float value : v) {
    norm += value * value;
  }
  norm = sqrt(norm);

  if (norm == 0) {
    return;
  }

  for (float &value : v) {
    value /= norm;
  }
}
} // namespace rnexecutorch::numerical