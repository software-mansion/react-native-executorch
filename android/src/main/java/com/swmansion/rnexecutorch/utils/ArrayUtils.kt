package com.swmansion.rnexecutorch.utils

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import org.pytorch.executorch.DType
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class ArrayUtils {
  companion object {
    inline fun <reified T> createTypedArrayFromReadableArray(
      input: ReadableArray,
      transform: (ReadableArray, Int) -> T,
    ): Array<T> = Array(input.size()) { index -> transform(input, index) }

    fun createByteArray(input: ReadableArray): ByteArray =
      createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index).toByte() }.toByteArray()

    fun createCharArray(input: ReadableArray): CharArray =
      createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index).toChar() }.toCharArray()

    fun createIntArray(input: ReadableArray): IntArray =
      createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index) }.toIntArray()

    fun createFloatArray(input: ReadableArray): FloatArray =
      createTypedArrayFromReadableArray(input) { array, index -> array.getDouble(index).toFloat() }.toFloatArray()

    fun createLongArray(input: ReadableArray): LongArray =
      createTypedArrayFromReadableArray(input) { array, index -> array.getInt(index).toLong() }.toLongArray()

    fun createDoubleArray(input: ReadableArray): DoubleArray =
      createTypedArrayFromReadableArray(input) { array, index -> array.getDouble(index) }.toDoubleArray()

    fun <V> createMapArray(input: ReadableArray): Array<Map<String, V>> {
      val mapArray = Array<Map<String, V>>(input.size()) { mapOf() }
      for (i in 0 until input.size()) {
        mapArray[i] = input.getMap(i)?.toHashMap() as Map<String, V>
      }
      return mapArray
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

    fun writableArrayToEValue(input: WritableArray): EValue {
      val size = input.size()
      val preprocessorInputShape = longArrayOf(1, size.toLong())
      return EValue.from(Tensor.fromBlob(createFloatArray(input), preprocessorInputShape))
    }
  }
}
