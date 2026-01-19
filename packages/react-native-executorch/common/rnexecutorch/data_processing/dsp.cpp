#include <cmath>
#include <cstddef>
#include <numbers>
#include <vector>

#include <rnexecutorch/data_processing/FFT.h>
#include <rnexecutorch/data_processing/dsp.h>

namespace rnexecutorch::dsp {

using std::numbers::pi_v;

//https://www.mathworks.com/help/signal/ref/hann.html
std::vector<float> hannWindow(size_t size) {
  std::vector<float> window(size); 
  for (size_t i = 0; i < size; i++) { 
    window[i] = 0.5f * (1.0f - std::cosf(2.0f * pi_v<float> * static_cast<float>(i) / static_cast<float>(size)));
  } 
  return window; 
} 

} // namespace rnexecutorch::dsp
