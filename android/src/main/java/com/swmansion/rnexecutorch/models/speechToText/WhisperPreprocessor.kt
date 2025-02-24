package com.swmansion.rnexecutorch.models.speechToText

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.STFT
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class WhisperPreprocessor(reactApplicationContext: ReactApplicationContext) :
  BaseModel<ReadableArray, EValue>(reactApplicationContext) {
    private val fftSize = 512
    private val hopLength = 160
    private val stft = STFT(fftSize, hopLength)

  override fun runModel(input: ReadableArray): EValue {
    val size = input.size()
    val inputFloatArray = FloatArray(size)
    for (i in 0 until size) {
      inputFloatArray[i] = input.getDouble(i).toFloat()
    }
    val stftResult = this.stft.fromWaveform(inputFloatArray)
    val numStftFrames = stftResult.size / (this.fftSize / 2)
    val preprocessorInputShape = longArrayOf(numStftFrames.toLong(), (this.fftSize / 2).toLong())
    val melSpectrogram = this.module.forward(EValue.from(Tensor.fromBlob(stftResult, preprocessorInputShape)))
    return melSpectrogram[0]
  }

  override fun preprocess(input: ReadableArray): EValue {
    TODO("Not yet implemented")
  }

  override fun postprocess(output: Array<EValue>): EValue {
    TODO("Not yet implemented")
  }
}
