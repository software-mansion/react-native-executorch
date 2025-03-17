package com.swmansion.rnexecutorch.models.speechtotext

import android.util.Log
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
  lateinit var encoderOutput: EValue

  abstract fun setGeneratedTokens(tokens: ReadableArray)

  abstract fun getTokensEValue(): EValue

  override fun runModel(input: ReadableArray): Int {
    Log.i("rn_executorch", "BaseS2TDecoder:runModel")
    var encoderOutput = this.encoderOutput
    if (input.size() != 0) {
      encoderOutput = this.preprocess(input)
    }
    val tokensEValue = getTokensEValue()
    Log.i("rn_executorch", "BaseS2TDecoder:decode")
    val tmp =
      this.module
        .execute(methodName, tokensEValue, encoderOutput)[0]
        .toTensor()
        .dataAsLongArray
        .last()
        .toInt()
    Log.i("rn_executorch", "BaseS2TDecoder:decode")
    return tmp
  }

  abstract fun getInputShape(inputLength: Int): LongArray

  fun preprocess(inputArray: ReadableArray): EValue {
//    val inputArray = input.getArray(0)!!
    val preprocessorInputShape = this.getInputShape(inputArray.size())
    return EValue.from(Tensor.fromBlob(createFloatArray(inputArray), preprocessorInputShape))
  }
}
