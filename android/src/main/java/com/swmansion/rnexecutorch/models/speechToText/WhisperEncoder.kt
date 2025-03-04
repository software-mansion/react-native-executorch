package com.swmansion.rnexecutorch.models.speechToText

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.STFT
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class WhisperEncoder(reactApplicationContext: ReactApplicationContext) :
  BaseModel<ReadableArray, EValue>(reactApplicationContext) {

  private val fftSize = 512
  private val hopLength = 160
  private val stftFrameSize = (this.fftSize / 2).toLong()
  private val stft = STFT(fftSize, hopLength)

  override fun runModel(input: ReadableArray): EValue {
    val inputEValue = this.preprocess(input)
    val hiddenState = this.module.forward(inputEValue)
    return hiddenState[0]
    // val size = input.size()
    // val inputFloatArray = FloatArray(size)
    // for (i in 0 until size) {
    //   inputFloatArray[i] = input.getDouble(i).toFloat()
    // }
    // val stftResult = this.stft.fromWaveform(inputFloatArray)
    // val numStftFrames = stftResult.size / (this.fftSize / 2)
    // val preprocessorInputShape = longArrayOf(numStftFrames.toLong(), (this.fftSize / 2).toLong())
    // val hiddenState = this.module.forward(EValue.from(Tensor.fromBlob(stftResult, preprocessorInputShape)))
    // return hiddenState[0]
  }

  override fun preprocess(input: ReadableArray): EValue {
    val waveformFloatArray = ArrayUtils.createFloatArray(input)

    val stftResult = this.stft.fromWaveform(waveformFloatArray)
    val numStftFrames = stftResult.size / this.stftFrameSize
    val inputTensor = Tensor.fromBlob(stftResult, longArrayOf(numStftFrames, this.stftFrameSize))
    return EValue.from(inputTensor)
  }

  override fun postprocess(output: Array<EValue>): EValue {
    TODO("Not yet implemented")
  }
}
