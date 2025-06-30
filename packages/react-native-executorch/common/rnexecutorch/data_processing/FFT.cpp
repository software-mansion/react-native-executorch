#include <rnexecutorch/data_processing/FFT.h>

namespace rnexecutorch::dsp {

FFT::FFT(int size) : size_(size) {
  pffftSetup_ = pffft_new_setup(size_, PFFFT_REAL);
  work_ = (float *)pffft_aligned_malloc(size_ * sizeof(float));
}

FFT::~FFT() {
  pffft_destroy_setup(pffftSetup_);
  pffft_aligned_free(work_);
}

void FFT::doFFT(float *in, std::vector<std::complex<float>> &out) {
  pffft_transform_ordered(pffftSetup_, in, reinterpret_cast<float *>(&out[0]),
                          work_, PFFFT_FORWARD);

  // Scale by 1/size to match the normalization in SFFT.mm
  float scale = 1.0f / static_cast<float>(size_);
  float *outPtr = reinterpret_cast<float *>(&out[0]);
  for (int i = 0; i < size_ * 2; i++) {
    outPtr[i] *= scale;
  }
}

} // namespace rnexecutorch::dsp