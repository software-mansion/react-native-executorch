package com.swmansion.rnexecutorch.models.speechToText

import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class WhisperEncoder(reactApplicationContext: ReactApplicationContext) :
  BaseModel<EValue, EValue>(reactApplicationContext) {
    private val encoderInputShape = longArrayOf(1L, 80L, 3000L)

  override fun runModel(input: EValue): EValue {
    val inputEValue = this.preprocess(input)
    val hiddenState = this.module.forward(inputEValue)
    return hiddenState[0]
  }

  override fun preprocess(input: EValue): EValue {
    val inputTensor = Tensor.fromBlob(input.toTensor().dataAsFloatArray, this.encoderInputShape)
    return EValue.from(inputTensor)
  }

  override fun postprocess(output: Array<EValue>): EValue {
    TODO("Not yet implemented")
  }
}
