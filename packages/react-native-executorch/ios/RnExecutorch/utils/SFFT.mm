#import "SFFT.hpp"

@implementation SFFT

+ (NSArray *)sfftFromWaveform:(NSArray *)waveform
                      fftSize:(int)fftSize
                 fftHopLength:(int)fftHopLength {
  FFTSetup fftSetup = vDSP_create_fftsetup(log2(fftSize), kFFTRadix2);
  if (!fftSetup) {
    NSLog(@"Error creating FFT setup.");
  }

  // Generate Hann Window coefficients.
  // https://www.mathworks.com/help/signal/ref/hann.html
  float hann[fftSize];
  for (int i = 0; i < fftSize; i++) {
    hann[i] = 0.5 * (1 - cos(2 * M_PI * i / (fftSize - 1)));
  }

  NSMutableArray *stftResult = [NSMutableArray new];
  int currentIndex = 0;
  while (currentIndex + fftSize <= waveform.count) {
    float signal[fftSize];

    // Extract signal and apply the Hann window
    for (int i = 0; i < fftSize; i++) {
      signal[i] = [waveform[currentIndex + i] floatValue] * hann[i];
    }

    [SFFT fft:signal fftSetup:fftSetup magnitudes:stftResult fftSize:fftSize];

    currentIndex += fftHopLength;
  }

  vDSP_destroy_fftsetup(fftSetup);
  return stftResult;
}

+ (void)fft:(float *)signal
      fftSetup:(FFTSetup)fftSetup
    magnitudes:(NSMutableArray *)magnitudes
       fftSize:(int)fftSize {
  const int log2n = log2(fftSize);
  DSPSplitComplex a;
  a.realp = (float *)malloc(fftSize / 2 * sizeof(float));
  a.imagp = (float *)malloc(fftSize / 2 * sizeof(float));

  // Perform the FFT
  vDSP_ctoz((DSPComplex *)signal, 2, &a, 1, fftSize / 2);
  vDSP_fft_zrip(fftSetup, &a, 1, log2n, FFT_FORWARD);

  // Zero out Nyquist component
  a.imagp[0] = 0.0f;

  const float magnitudeScale = 1.0f / fftSize;
  for (int i = 0; i < fftSize / 2; ++i) {
    double magnitude = sqrt(a.realp[i] * a.realp[i] + a.imagp[i] * a.imagp[i]) *
                       magnitudeScale;
    // FIXME: we don't need that, but if we remove this we have to get rid of
    // reversing this operation in the preprocessing part
    double magnitudeDb = 20 * log10f(magnitude);
    // Push to the result array
    [magnitudes addObject:@(magnitudeDb)];
  }

  // Cleanup
  free(a.realp);
  free(a.imagp);
}

@end
