#include <cstddef>
#include <math.h>
#include <rnexecutorch/data_processing/FFT.h>
#include <rnexecutorch/data_processing/dsp.h>

namespace rnexecutorch::dsp {

using namespace rnexecutorch::dsp;

std::vector<float> hannWindow(size_t size) {
  // https://www.mathworks.com/help/signal/ref/hann.html
  std::vector<float> window(size);
  for (size_t i = 0; i < size; i++) {
    window[i] = 0.5f * (1 - std::cos(2 * M_PI * i / size));
  }
  return window;
}

} // namespace rnexecutorch::dsp
