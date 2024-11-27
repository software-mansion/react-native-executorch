package com.swmansion.rnexecutorch.utils

import com.facebook.react.bridge.ReadableArray
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class TensorUtils {
  companion object {
    fun getExecutorchInput(input: ReadableArray, shape: LongArray, type: Int): EValue {
      try {
        when (type) {
          0 -> {
            val inputTensor = Tensor.fromBlob(ArrayUtils.createByteArray(input), shape)
            return EValue.from(inputTensor)
          }

          1 -> {
            val inputTensor = Tensor.fromBlob(ArrayUtils.createIntArray(input), shape)
            return EValue.from(inputTensor)
          }

          2 -> {
            val inputTensor = Tensor.fromBlob(ArrayUtils.createLongArray(input), shape)
            return EValue.from(inputTensor)
          }

          3 -> {
            val inputTensor = Tensor.fromBlob(ArrayUtils.createFloatArray(input), shape)
            return EValue.from(inputTensor)
          }

          4 -> {
            val inputTensor = Tensor.fromBlob(ArrayUtils.createDoubleArray(input), shape)
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
