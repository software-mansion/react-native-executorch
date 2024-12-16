package com.swmansion.rnexecutorch.utils

import android.content.Context
import android.net.Uri
import android.util.Base64
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgcodecs.Imgcodecs
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor
import java.io.File
import java.io.InputStream
import java.net.URL
import java.util.UUID


class ImageProcessor {
  companion object {
    fun matToEValue(mat: Mat, shape: LongArray): EValue {
      val pixelCount = mat.cols() * mat.rows()
      val floatArray = FloatArray(pixelCount * 3)

      for (i in 0 until pixelCount) {
        val row = i / mat.cols()
        val col = i % mat.cols()
        val pixel = mat.get(row, col)

        if (mat.type() == CvType.CV_8UC3 || mat.type() == CvType.CV_8UC4) {
          val b = pixel[0] / 255.0f
          val g = pixel[1] / 255.0f
          val r = pixel[2] / 255.0f

          floatArray[i] = r.toFloat()
          floatArray[pixelCount + i] = g.toFloat()
          floatArray[2 * pixelCount + i] = b.toFloat()
        }
      }

      return EValue.from(Tensor.fromBlob(floatArray, shape))
    }

    fun EValueToMat(array: FloatArray, width: Int, height: Int): Mat {
      val mat = Mat(height, width, CvType.CV_8UC3)

      val pixelCount = width * height
      for (i in 0 until pixelCount) {
        val row = i / width
        val col = i % width

        val r = (array[i] * 255).toInt().toByte()
        val g = (array[pixelCount + i] * 255).toInt().toByte()
        val b = (array[2 * pixelCount + i] * 255).toInt().toByte()

        val color = byteArrayOf(b, g, r)
        mat.put(row, col, color)
      }
      return mat
    }

    fun saveToTempFile(context: Context, mat: Mat): String {
      try {
        val uniqueID = UUID.randomUUID().toString()
        val tempFile = File(context.cacheDir, "rn_executorch_$uniqueID.png")
        Imgcodecs.imwrite(tempFile.absolutePath, mat)

        return "file://${tempFile.absolutePath}"
      }catch (e: Exception) {
        throw Exception(ETError.FileWriteFailed.toString())
      }
    }

    fun readImage(source: String): Mat {
      val inputImage: Mat

      val uri = Uri.parse(source)
      val scheme = uri.scheme ?: ""

      when {
        scheme.equals("data", ignoreCase = true) -> {
          //base64
          val parts = source.split(",", limit = 2)
          if (parts.size < 2) throw IllegalArgumentException(ETError.InvalidArgument.toString())

          val encodedString = parts[1]
          val data = Base64.decode(encodedString, Base64.DEFAULT)

          val encodedData = Mat(1, data.size, CvType.CV_8UC1).apply {
            put(0, 0, data)
          }
          inputImage = Imgcodecs.imdecode(encodedData, Imgcodecs.IMREAD_COLOR)
        }
        scheme.equals("file", ignoreCase = true) -> {
          //device storage
          val path = uri.path
          inputImage = Imgcodecs.imread(path, Imgcodecs.IMREAD_COLOR)
        }
        else -> {
          //external source
          val url = URL(source)
          val connection = url.openConnection()
          connection.connect()

          val inputStream: InputStream = connection.getInputStream()
          val data = inputStream.readBytes()
          inputStream.close()

          val encodedData = Mat(1, data.size, CvType.CV_8UC1).apply {
            put(0, 0, data)
          }
          inputImage = Imgcodecs.imdecode(encodedData, Imgcodecs.IMREAD_COLOR)
        }
      }

      if (inputImage.empty()) {
        throw IllegalArgumentException(ETError.InvalidArgument.toString())
      }

      return inputImage
    }
  }
}
