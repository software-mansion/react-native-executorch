package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createFloatArray
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

abstract class BaseS2TDecoder(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<ReadableArray, Int>(reactApplicationContext) {
  protected abstract var methodName: String

  abstract fun setGeneratedTokens(tokens: ReadableArray)

  abstract fun getTokensEValue(): EValue

  override fun runModel(input: ReadableArray): Int {
    val tokensEValue = getTokensEValue()
    return this.module
      .execute(methodName, tokensEValue, this.preprocess(input))[0]
      .toTensor()
      .dataAsLongArray
      .last()
      .toInt()
  }

  abstract fun getInputShape(inputLength: Int): LongArray

  fun preprocess(input: ReadableArray): EValue {
    val inputArray = input.getArray(0)!!
    val preprocessorInputShape = this.getInputShape(inputArray.size())
    return EValue.from(Tensor.fromBlob(createFloatArray(inputArray), preprocessorInputShape))
  }

  fun postprocess(output: Array<EValue>): Int {
    TODO("Not yet implemented")
  }
}
