#pragma once
extern "C" {
#include <pfft/pfft.h>
}
#include <complex>
#include <vector>

namespace rnexecutorch::dsp {

class FFT final {
public:
  explicit FFT(int size);
  ~FFT();
  void doFFT(float *in, std::vector<std::complex<float>> &out);

private:
  int size_;

  PFFFT_Setup *pffftSetup_;
  float *work_;
};

} // namespace rnexecutorch::dsp
