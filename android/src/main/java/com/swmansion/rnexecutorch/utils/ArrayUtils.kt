package com.swmansion.rnexecutorch.utils

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import org.pytorch.executorch.DType
import org.pytorch.executorch.Tensor

class ArrayUtils {
  companion object {
    fun createByteArray(input: ReadableArray): ByteArray {
      val byteArray = ByteArray(input.size())
      for (i in 0 until input.size()) {
        byteArray[i] = input.getInt(i).toByte()
      }
      return byteArray
    }

    fun createIntArray(input: ReadableArray): IntArray {
      val intArray = IntArray(input.size())
      for (i in 0 until input.size()) {
        intArray[i] = input.getInt(i)
      }
      return intArray
    }

    fun createFloatArray(input: ReadableArray): FloatArray {
      val floatArray = FloatArray(input.size())
      for (i in 0 until input.size()) {
        floatArray[i] = input.getDouble(i).toFloat()
      }
      return floatArray
    }

    fun createLongArray(input: ReadableArray): LongArray {
      val longArray = LongArray(input.size())
      for (i in 0 until input.size()) {
        longArray[i] = input.getInt(i).toLong()
      }
      return longArray
    }

    fun createDoubleArray(input: ReadableArray): DoubleArray {
      val doubleArray = DoubleArray(input.size())
      for (i in 0 until input.size()) {
        doubleArray[i] = input.getDouble(i)
      }
      return doubleArray
    }

    fun createReadableArray(result: Tensor): ReadableArray {
      val resultArray = Arguments.createArray()
      when (result.dtype()) {
        DType.UINT8 -> {
          val byteArray = result.dataAsByteArray
          for (i in byteArray) {
            resultArray.pushInt(i.toInt())
          }
        }

        DType.INT32 -> {
          val intArray = result.dataAsIntArray
          for (i in intArray) {
            resultArray.pushInt(i)
          }
        }

        DType.FLOAT -> {
          val longArray = result.dataAsFloatArray
          for (i in longArray) {
            resultArray.pushDouble(i.toDouble())
          }
        }

        DType.DOUBLE -> {
          val floatArray = result.dataAsDoubleArray
          for (i in floatArray) {
            resultArray.pushDouble(i)
          }
        }

        DType.INT64 -> {
          val doubleArray = result.dataAsLongArray
          for (i in doubleArray) {
            resultArray.pushLong(i)
          }
        }

        else -> {
          throw IllegalArgumentException("Invalid dtype: ${result.dtype()}")
        }
      }

      return resultArray
    }
  }
}
