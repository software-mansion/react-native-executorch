package com.swmansion.rnexecutorch.utils

import android.graphics.Bitmap
import android.graphics.Color
import com.facebook.react.bridge.ReadableArray
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor
import java.nio.FloatBuffer

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

    fun float32TensorToBitmap(tensor: Tensor): Bitmap {
      val shape = tensor.shape() // Assuming the tensor shape is [1, 3, H, W]
      val height = shape[2].toInt()
      val width = shape[3].toInt()

      val floatArray = tensor.dataAsFloatArray

      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val pixels = IntArray(width * height)

      val offsetG = height * width
      val offsetB = 2 * height * width

      for (y in 0 until height) {
        for (x in 0 until width) {
          val r = Math.round(floatArray[y * width + x] * 255.0f)
          val g = Math.round(floatArray[offsetG + y * width + x] * 255.0f)
          val b = Math.round(floatArray[offsetB + y * width + x] * 255.0f)
          pixels[y * width + x] = (0xFF shl 24) or (r shl 16) or (g shl 8) or b
        }
      }

      bitmap.setPixels(pixels, 0, width, 0, 0, width, height)
      return bitmap
    }

    fun bitmapToFloat32Tensor(bitmap: Bitmap): Tensor {
      val height = bitmap.height
      val width = bitmap.width
      val floatBuffer = Tensor.allocateFloatBuffer(3 * width * height)
      bitmapToFloatBuffer(bitmap, floatBuffer)
      return Tensor.fromBlob(floatBuffer, longArrayOf(1, 3, height.toLong(), width.toLong()))
    }

    private fun bitmapToFloatBuffer(
      bitmap: Bitmap,
      outBuffer: FloatBuffer,
    ) {
      val pixelsCount = bitmap.height * bitmap.width
      val pixels = IntArray(pixelsCount)
      bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
      val offsetG = pixelsCount
      val offsetB = 2 * pixelsCount
      for (i in 0 until pixelsCount) {
        val c = pixels[i]
        val r = Color.red(c) / 255.0f
        val g = Color.green(c) / 255.0f
        val b = Color.blue(c) / 255.0f
        outBuffer.put(i, r)
        outBuffer.put( offsetG + i, g)
        outBuffer.put( offsetB + i, b)
      }
    }
  }
}
