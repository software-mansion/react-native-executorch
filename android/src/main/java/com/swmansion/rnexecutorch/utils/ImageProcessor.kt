package com.swmansion.rnexecutorch.utils

import android.content.Context
import android.net.Uri
import android.util.Base64
import android.util.Log
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor
import java.io.File
import java.io.InputStream
import java.net.URL
import java.util.UUID
import kotlin.math.floor


class ImageProcessor {
  companion object {
    fun matToEValue(mat: Mat, shape: LongArray): EValue {
      return matToEValue(mat, shape, Scalar(0.0, 0.0, 0.0), Scalar(1.0, 1.0, 1.0))
    }

    fun matToEValue(mat: Mat, shape: LongArray, mean: Scalar, variance: Scalar): EValue {
      val pixelCount = mat.cols() * mat.rows()
      val floatArray = FloatArray(pixelCount * 3)

      for (i in 0 until pixelCount) {
        val row = i / mat.cols()
        val col = i % mat.cols()
        val pixel = mat.get(row, col)

        if (mat.type() == CvType.CV_8UC3 || mat.type() == CvType.CV_8UC4) {
          val b = (pixel[0] - mean.`val`[0] * 255.0f) / (variance.`val`[0] * 255.0f)
          val g = (pixel[1] - mean.`val`[1] * 255.0f) / (variance.`val`[1] * 255.0f)
          val r = (pixel[2] - mean.`val`[2] * 255.0f) / (variance.`val`[2] * 255.0f)

          floatArray[0 * pixelCount + i] = b.toFloat()
          floatArray[1 * pixelCount + i] = g.toFloat()
          floatArray[2 * pixelCount + i] = r.toFloat()
        }
      }

      return EValue.from(Tensor.fromBlob(floatArray, shape))
    }

    fun matToEValueGray(mat: Mat): EValue {
      val pixelCount = mat.cols() * mat.rows()
      val floatArray = FloatArray(pixelCount)

      for (i in 0 until pixelCount) {
        val row = i / mat.cols()
        val col = i % mat.cols()
        val pixel = mat.get(row, col)
        floatArray[i] = pixel[0].toFloat()
      }

      return EValue.from(
        Tensor.fromBlob(
          floatArray,
          longArrayOf(1, 1, mat.rows().toLong(), mat.cols().toLong())
        )
      )
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
      } catch (e: Exception) {
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

    fun resizeWithPadding(img: Mat, desiredWidth: Int, desiredHeight: Int): Mat {
      val height = img.rows()
      val width = img.cols()
      val heightRatio = desiredHeight.toFloat() / height
      val widthRatio = desiredWidth.toFloat() / width
      val resizeRatio = minOf(heightRatio, widthRatio)
      val newWidth = (width * resizeRatio).toInt()
      val newHeight = (height * resizeRatio).toInt()

      val resizedImg = Mat()
      Imgproc.resize(
        img,
        resizedImg,
        Size(newWidth.toDouble(), newHeight.toDouble()),
        0.0,
        0.0,
        Imgproc.INTER_AREA
      )

      val cornerPatchSize = maxOf(1, minOf(width, height) / 30)
      val corners = listOf(
        img.submat(0, cornerPatchSize, 0, cornerPatchSize),
        img.submat(0, cornerPatchSize, width - cornerPatchSize, width),
        img.submat(height - cornerPatchSize, height, 0, cornerPatchSize),
        img.submat(height - cornerPatchSize, height, width - cornerPatchSize, width)
      )

      var backgroundScalar = Core.mean(corners[0])
      for (i in 1 until corners.size) {
        val mean = Core.mean(corners[i])
        backgroundScalar = Scalar(
          backgroundScalar.`val`[0] + mean.`val`[0],
          backgroundScalar.`val`[1] + mean.`val`[1],
          backgroundScalar.`val`[2] + mean.`val`[2]
        )
      }

      backgroundScalar = Scalar(
        floor(backgroundScalar.`val`[0] / corners.size),
        floor(backgroundScalar.`val`[1] / corners.size),
        floor(backgroundScalar.`val`[2] / corners.size)
      )

      val deltaW = desiredWidth - newWidth
      val deltaH = desiredHeight - newHeight
      val top = deltaH / 2
      val bottom = deltaH - top
      val left = deltaW / 2
      val right = deltaW - left

      val centeredImg = Mat()
      Core.copyMakeBorder(
        resizedImg,
        centeredImg,
        top,
        bottom,
        left,
        right,
        Core.BORDER_CONSTANT,
        backgroundScalar
      )

      return centeredImg
    }
  }
}
