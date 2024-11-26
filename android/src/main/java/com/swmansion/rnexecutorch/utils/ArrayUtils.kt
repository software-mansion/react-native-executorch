package com.swmansion.rnexecutorch.utils

import com.facebook.react.bridge.ReadableArray

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
  }
}
