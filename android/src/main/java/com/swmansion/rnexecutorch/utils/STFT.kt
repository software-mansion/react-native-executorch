 package com.swmansion.rnexecutorch.utils

 import java.util.Vector
 import kotlin.math.cos
 import kotlin.math.PI
 import org.jtransforms.fft.FloatFFT_1D
 import kotlin.math.sqrt

 class STFT public constructor(var fftSize: Int = 512, var hopLength: Int = 160) {
   private val fftModule = FloatFFT_1D(this.fftSize.toLong())
   private val magnitudeScale = 1.0 / this.fftSize
   // https://www.mathworks.com/help/signal/ref/hann.html
   private val hannWindow = FloatArray(this.fftSize) { i ->0.5f - 0.5f * cos(2f * PI.toFloat() * i / this.fftSize) }


   fun fromWaveform(signal: FloatArray): FloatArray {
     val numFftFrames = (signal.size - this.fftSize) / this.hopLength
     // The output of FFT is always 2x smaller
     val stft = FloatArray(numFftFrames * (this.fftSize / 2))

     var windowStartIdx = 0
     var outputIndex = 0
     // TODO: i dont think the substraction at the end is needed
     while (windowStartIdx + this.fftSize < signal.size - this.fftSize) {
       val currentWindow = signal.copyOfRange(windowStartIdx, windowStartIdx + this.fftSize)
       // Apply Hann window to the current slice
       for (i in currentWindow.indices) currentWindow[i] *= this.hannWindow[i]

       // Perform in-place FFT
       this.fftModule.realForward(currentWindow)

       stft[outputIndex++] = kotlin.math.abs(currentWindow[0])
       for (i in 1 until this.fftSize / 2 - 1) {
         val real = currentWindow[2 * i]
         val imag = currentWindow[2 * i + 1]

         val currentMagnitude = (sqrt(real * real + imag * imag) * this.magnitudeScale).toFloat()
         // FIXME: we don't need that, but if we remove this we have to get rid of
         // reversing this operation in the preprocessing part
         stft[outputIndex++] = 20 * kotlin.math.log10(currentMagnitude)
       }
       // Nyquist frequency
       stft[outputIndex++] = kotlin.math.abs(currentWindow[1])
       windowStartIdx += this.hopLength
     }
     return stft
   }
 }
