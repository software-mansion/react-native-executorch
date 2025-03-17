package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createFloatArray
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class MoonshineEncoder(
  reactApplicationContext: ReactApplicationContext,
) : BaseModel<ReadableArray, Array<EValue>>(reactApplicationContext) {
  override fun runModel(input: ReadableArray): Array<EValue> = this.module.forward(this.preprocess(input))

  private fun preprocess(input: ReadableArray): EValue {
    val size = input.size()
    val preprocessorInputShape = longArrayOf(1, size.toLong())
    return EValue.from(Tensor.fromBlob(createFloatArray(input), preprocessorInputShape))
  }
}
