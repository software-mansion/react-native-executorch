package com.swmansion.rnexecutorch.models.speech_to_text

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.STFT
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
    // WhisperPreprocessor returns an EValue which is passed here.
    // For some reason I can't just pass the EValue to the forward, instead i need to
    // do that silly stuff. I have no idea why, but if i just run this.module.forward(input), it
    // doesn't work :(
    val inputTensor = Tensor.fromBlob(input.toTensor().dataAsFloatArray, this.encoderInputShape)
    return EValue.from(inputTensor)
  }

  override fun postprocess(output: Array<EValue>): EValue {
    TODO("Not yet implemented")
  }
}
