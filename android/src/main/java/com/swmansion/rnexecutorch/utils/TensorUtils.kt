package com.swmansion.rnexecutorch.utils

import com.facebook.react.bridge.ReadableArray
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class TensorUtils {
  companion object {
    fun getEvalue(input: ReadableArray, shape: LongArray, type: Int): EValue {
      try {
        when (type) {
          0 -> {
            val input = ArrayUtils.createByteArray(input)
            val inputTensor = Tensor.fromBlob(input, shape)
            return EValue.from(inputTensor)
          }

          1 -> {
            val input = ArrayUtils.createIntArray(input)
            val inputTensor = Tensor.fromBlob(input, shape)
            return EValue.from(inputTensor)
          }

          2 -> {
            val input = ArrayUtils.createLongArray(input)
            val inputTensor = Tensor.fromBlob(input, shape)
            return EValue.from(inputTensor)
          }

          3 -> {
            val input = ArrayUtils.createFloatArray(input)
            val inputTensor = Tensor.fromBlob(input, shape)
            return EValue.from(inputTensor)
          }

          4 -> {
            val input = ArrayUtils.createDoubleArray(input)
            val inputTensor = Tensor.fromBlob(input, shape)
            return EValue.from(inputTensor)
          }

          else -> {
            throw IllegalArgumentException("Invalid input type: $type")
          }
        }
      } catch (e: IllegalArgumentException) {
        throw e
      }
    }
  }
}
