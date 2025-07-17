#include <rnexecutorch/data_processing/FFT.h>

namespace rnexecutorch::dsp {

FFT::FFT(int size) : size_(size) {
  pffftSetup_ = pffft_new_setup(size_, PFFFT_REAL);
  work_ = static_cast<float *>(pffft_aligned_malloc(size_ * sizeof(float)));
}

FFT::~FFT() {
  pffft_destroy_setup(pffftSetup_);
  pffft_aligned_free(work_);
}

void FFT::doFFT(float *in, std::vector<std::complex<float>> &out) {
  pffft_transform_ordered(pffftSetup_, in,
                          reinterpret_cast<float *>(out.data()), work_,
                          PFFFT_FORWARD);
}

} // namespace rnexecutorch::dsp
