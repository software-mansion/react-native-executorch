package com.swmansion.rnexecutorch.utils

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import org.pytorch.executorch.DType
import org.pytorch.executorch.Tensor

class ArrayUtils {
  companion object {
    inline fun <reified T> createTypedArrayFromReadableArray(input: ReadableArray, transform: (ReadableArray, Int) -> T): Array<T> {
      return Array(input.size()) { index -> transform(input, index) }
    }

    fun createByteArray(input: ReadableArray): ByteArray {
      return createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index).toByte() }.toByteArray()
    }

    fun createCharArray(input: ReadableArray): CharArray {
      return createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index).toChar() }.toCharArray()
    }

    fun createByteArray(input: ReadableArray): ByteArray {
      return createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index).toByte() }.toByteArray()
    }
    fun createIntArray(input: ReadableArray): IntArray {
      return createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index) }.toIntArray()
    }

    fun createFloatArray(input: ReadableArray): FloatArray {
      return createTypedArrayFromReadableArray(input) { array, index -> array.getDouble(index).toFloat() }.toFloatArray()
    }

    fun createLongArray(input: ReadableArray): LongArray {
      return createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index).toLong() }.toLongArray()
    }

    fun createDoubleArray(input: ReadableArray): DoubleArray {
      return createTypedArrayFromReadableArray(input) { array, index -> array.getDouble(index) }.toDoubleArray()
    }
    fun createReadableArrayFromTensor(result: Tensor): ReadableArray {
      val resultArray = Arguments.createArray()

      when (result.dtype()) {
        DType.UINT8 -> {
          result.dataAsByteArray.forEach { resultArray.pushInt(it.toInt()) }
        }

        DType.INT32 -> {
          result.dataAsIntArray.forEach { resultArray.pushInt(it) }
        }

        DType.FLOAT -> {
          result.dataAsFloatArray.forEach { resultArray.pushDouble(it.toDouble()) }
        }

        DType.DOUBLE -> {
          result.dataAsDoubleArray.forEach { resultArray.pushDouble(it) }
        }

        DType.INT64 -> {
          // TODO: Do something to handle or deprecate long dtype
          // https://github.com/facebook/react-native/issues/12506
          result.dataAsLongArray.forEach { resultArray.pushInt(it.toInt()) }
        }

        else -> {
          throw IllegalArgumentException("Invalid dtype: ${result.dtype()}")
        }
      }

      return resultArray
    }

    fun createReadableArrayFromFloatArray(input: FloatArray): ReadableArray {
      val resultArray = Arguments.createArray()
      input.forEach { resultArray.pushDouble(it.toDouble()) }
      return resultArray
    }

    fun createReadableArrayFromIntArray(input: IntArray): ReadableArray {
      val resultArray = Arguments.createArray()
      input.forEach { resultArray.pushInt(it) }
      return resultArray
    }

  }
}
