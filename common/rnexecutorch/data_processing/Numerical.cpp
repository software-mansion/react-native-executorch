#include "Numerical.h"

#include <algorithm>
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
} // namespace rnexecutorch::numerical