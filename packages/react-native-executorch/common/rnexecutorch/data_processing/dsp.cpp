#include <cmath>
#include <math.h>
#include <memory>
#include <rnexecutorch/data_processing/FFT.h>
#include <rnexecutorch/data_processing/dsp.h>

namespace rnexecutorch::dsp {

/// @brief Generates Hann Window coefficients:
/// https://www.mathworks.com/help/signal/ref/hann.html
std::vector<float> hann_window(std::size_t size) {
  std::vector<float> hann(size); // ✅ Create elements

  for (std::size_t i = 0; i < size; i++) {
    hann[i] = 0.5f * (1.0f - std::cos(2.0f * M_PI * i / (size - 1)));
  }
  return hann;
}

} // namespace rnexecutorch::dsp