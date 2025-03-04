package com.swmansion.rnexecutorch.models.speechToText

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createDoubleArray
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createFloatArray
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class MoonshineEncoder(reactApplicationContext: ReactApplicationContext) :
  BaseModel<ReadableArray, EValue>(reactApplicationContext) {

  override fun runModel(input: ReadableArray): EValue {
    val size = input.size()
    val inputFloatArray = FloatArray(size)
    for (i in 0 until size) {
      inputFloatArray[i] = input.getDouble(i).toFloat()
    }
    val preprocessorInputShape = longArrayOf(1, size.toLong())
    val doubleInput = createDoubleArray(input);
    Log.i("rn_executorch", "${EValue.from(Tensor.fromBlob(doubleInput, preprocessorInputShape)).isTensor}")
    Log.i("rn_executorch", "${EValue.from(Tensor.fromBlob(doubleInput, preprocessorInputShape)).isDoubleList}")
    Log.i("rn_executorch", "${doubleInput} shape: ${Tensor.fromBlob(doubleInput, preprocessorInputShape).shape().size}")

    val hiddenState = this.module.forward(EValue.from(Tensor.fromBlob(doubleInput, preprocessorInputShape)))
    return hiddenState[0]
  }

  override fun preprocess(input: ReadableArray): EValue {
    TODO("Not yet implemented")
  }

  override fun postprocess(output: Array<EValue>): EValue {
    TODO("Not yet implemented")
  }
}
