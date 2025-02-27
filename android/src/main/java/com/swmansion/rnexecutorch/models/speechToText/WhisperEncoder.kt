package com.swmansion.rnexecutorch.models.speechToText

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor
import com.swmansion.rnexecutorch.utils.STFT

class WhisperEncoder(reactApplicationContext: ReactApplicationContext) :
  BaseModel<FloatArray, EValue>(reactApplicationContext) {
    private val fftSize = 512
    private val hopLength = 160
    private val stft = STFT(fftSize, hopLength)
    private val stftFrameSize = (this.fftSize / 2).toLong()

  override fun runModel(input: FloatArray): EValue {
    val inputEValue = this.preprocess(input)
    val hiddenState = this.module.forward(inputEValue)
    return hiddenState[0]
  }

  override fun preprocess(input: FloatArray): EValue {
    val stftResult = this.stft.fromWaveform(input)
    val numStftFrames = stftResult.size / this.stftFrameSize
    val inputTensor = Tensor.fromBlob(stftResult, longArrayOf(numStftFrames, this.stftFrameSize))
    return EValue.from(inputTensor)
  }

  override fun postprocess(output: Array<EValue>): EValue {
    TODO("Not yet implemented")
  }
}
