package com.swmansion.rnexecutorch.models.speechToText

import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createFloatArray
import org.pytorch.executorch.Tensor

class BaseS2TDecoder(reactApplicationContext: ReactApplicationContext): BaseModel<ReadableArray, Int>(reactApplicationContext)  {
  private lateinit var generatedTokens: LongArray
  var methodName: String = "forward"

  fun setGeneratedTokens(tokens: LongArray) {
    this.generatedTokens = tokens
  }

  override fun runModel(input: ReadableArray): Int {
    val tokensEValue = EValue.from(Tensor.fromBlob(this.generatedTokens, longArrayOf(1, generatedTokens.size.toLong())))
    return this.module
      .execute(methodName, tokensEValue, this.preprocess(input))[0]
      .toTensor()
      .dataAsLongArray.last()
      .toInt()
  }

  override fun preprocess(input: ReadableArray): EValue {
    val inputArray = input.getArray(0)!!
    val size = inputArray.size()
    val preprocessorInputShape = longArrayOf(1, size.toLong()/288, 288)
    return EValue.from(Tensor.fromBlob(createFloatArray(inputArray), preprocessorInputShape))
  }

  override fun postprocess(output: Array<EValue>): Int {
    TODO("Not yet implemented")
  }
}
