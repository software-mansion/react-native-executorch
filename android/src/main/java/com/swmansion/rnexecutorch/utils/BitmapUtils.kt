package com.swmansion.rnexecutorch.utils

import android.graphics.Bitmap
import android.graphics.Matrix
import android.net.Uri
import androidx.core.net.toUri
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class BitmapUtils {
  companion object {
    fun saveToTempFile(bitmap: Bitmap, fileName: String): Uri {
      val tempFile = File.createTempFile(fileName, ".png")
      var outputStream : FileOutputStream? = null
      try {
        outputStream = FileOutputStream(tempFile)
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      } catch (e: IOException) {
        e.printStackTrace()
      }
      finally {
        outputStream?.close()
      }
      return tempFile.toUri()
    }

    private fun rotateBitmap(bitmap: Bitmap, angle: Float): Bitmap {
      val matrix = Matrix()
      matrix.postRotate(angle)
      return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    private fun flipBitmap(bitmap: Bitmap, horizontal: Boolean, vertical: Boolean): Bitmap {
      val matrix = Matrix()
      matrix.preScale(
        if (horizontal) -1f else 1f,
        if (vertical) -1f else 1f
      )
      return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }
  }

}
