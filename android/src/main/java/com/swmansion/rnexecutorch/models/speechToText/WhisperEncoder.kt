package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.STFT
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class WhisperEncoder(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<ReadableArray, WritableArray>(reactApplicationContext) {
  private val fftSize = 512
  private val hopLength = 160
  private val stftFrameSize = (this.fftSize / 2).toLong()
  private val stft = STFT(fftSize, hopLength)

  override fun runModel(input: ReadableArray): WritableArray {
    val inputEValue = this.preprocess(input)
    val hiddenState = this.module.forward(inputEValue)
    return this.postprocess(hiddenState)
  }

  fun preprocess(input: ReadableArray): EValue {
    val waveformFloatArray = ArrayUtils.createFloatArray(input)

    val stftResult = this.stft.fromWaveform(waveformFloatArray)
    val numStftFrames = stftResult.size / this.stftFrameSize
    val inputTensor = Tensor.fromBlob(stftResult, longArrayOf(numStftFrames, this.stftFrameSize))
    return EValue.from(inputTensor)
  }

  fun postprocess(output: Array<EValue>): WritableArray {
    val outputWritableArray: WritableArray = Arguments.createArray()

    output[0].toTensor().dataAsFloatArray.map {
      outputWritableArray.pushDouble(
        it.toDouble(),
      )
    }
    return outputWritableArray
  }
}
