package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createFloatArray
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class MoonshineEncoder(reactApplicationContext: ReactApplicationContext) :
  BaseModel<ReadableArray, WritableArray>(reactApplicationContext) {

  override fun runModel(input: ReadableArray): WritableArray {
    return this.postprocess(this.module.forward(this.preprocess(input)))
  }

  override fun preprocess(input: ReadableArray): EValue {
    val size = input.size()
    val preprocessorInputShape = longArrayOf(1, size.toLong())
    return EValue.from(Tensor.fromBlob(createFloatArray(input), preprocessorInputShape))
  }

  public override fun postprocess(output: Array<EValue>): WritableArray {
    val outputWritableArray: WritableArray = Arguments.createArray()
    output[0].toTensor().dataAsFloatArray.map {outputWritableArray.pushDouble(
        it.toDouble()
    )}
    return outputWritableArray;
  }
}
