#include "Numerical.h"

#include <algorithm>
#include <numeric>

namespace rnexecutorch::numerical {
void softmax(std::vector<float> &v) {
  float max = *std::max_element(v.begin(), v.end());

  for (float &x : v) {
    x = std::exp(x - max);
  }
  float sum = std::accumulate(v.begin(), v.end(), 0.f);
  for (float &x : v) {
    x /= sum;
  }
}
} // namespace rnexecutorch::numerical