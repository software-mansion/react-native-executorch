package com.swmansion.rnexecutorch.models.speechToText

import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import com.facebook.react.bridge.ReactApplicationContext
import org.pytorch.executorch.Tensor

class BaseS2TDecoder(reactApplicationContext: ReactApplicationContext): BaseModel<EValue, Int>(reactApplicationContext)  {
  private lateinit var generatedTokens: MutableList<Int>

  fun setGeneratedTokens(tokens: MutableList<Int>) {
    this.generatedTokens = tokens
  }

  override fun runModel(input: EValue): Int {
    val tokensEValue = EValue.from(Tensor.fromBlob(this.generatedTokens.toIntArray(), longArrayOf(1, generatedTokens.size.toLong())))
    return this.module
      .forward(tokensEValue, input)[0]
      .toTensor()
      .dataAsLongArray[0]
      .toInt()
  }

  override fun preprocess(input: EValue): EValue {
    TODO("Not yet implemented")
  }

  override fun postprocess(output: Array<EValue>): Int {
    TODO("Not yet implemented")
  }
}
