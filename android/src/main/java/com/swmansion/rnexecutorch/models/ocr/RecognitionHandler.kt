package com.swmansion.rnexecutorch.models.ocr

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.ocr.utils.BBoxPoint
import com.swmansion.rnexecutorch.models.ocr.utils.CTCLabelConverter
import com.swmansion.rnexecutorch.models.ocr.utils.OCRbBox
import com.swmansion.rnexecutorch.models.ocr.utils.RecognizerUtils
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Core
import org.opencv.core.Mat

const val modelHeight = 64
const val largeModelWidth = 512
const val mediumModelWidth = 256
const val smallModelWidth = 128
const val lowConfidenceThreshold = 0.3
const val adjustContrast = 0.2

class RecognitionHandler(
  symbols: String,
  languageDictPath: String,
  reactApplicationContext: ReactApplicationContext
) {
  private val recognizerLarge = Recognizer(reactApplicationContext)
  private val recognizerMedium = Recognizer(reactApplicationContext)
  private val recognizerSmall = Recognizer(reactApplicationContext)
  private val converter = CTCLabelConverter(symbols, mapOf(languageDictPath to "key"))

  private fun runModel(croppedImage: Mat): Pair<List<Int>, Double> {
    val result: Pair<List<Int>, Double> = if (croppedImage.cols() >= largeModelWidth) {
      recognizerLarge.runModel(croppedImage)
    } else if (croppedImage.cols() >= mediumModelWidth) {
      recognizerMedium.runModel(croppedImage)
    } else {
      recognizerSmall.runModel(croppedImage)
    }

    return result
  }

  fun loadRecognizers(
    largeRecognizerPath: String,
    mediumRecognizerPath: String,
    smallRecognizerPath: String,
    onComplete: (Int, Exception?) -> Unit
  ) {
    try {
      recognizerLarge.loadModel(largeRecognizerPath)
      recognizerMedium.loadModel(mediumRecognizerPath)
      recognizerSmall.loadModel(smallRecognizerPath)
      onComplete(0, null)
    } catch (e: Exception) {
      onComplete(1, e)
    }
  }

  fun recognize(
    bBoxesList: List<OCRbBox>,
    imgGray: Mat,
    desiredWidth: Int,
    desiredHeight: Int
  ): WritableArray {
    val res: WritableArray = Arguments.createArray()
    val ratioAndPadding = RecognizerUtils.calculateResizeRatioAndPaddings(
      imgGray.width(),
      imgGray.height(),
      desiredWidth,
      desiredHeight
    )

    val left = ratioAndPadding["left"] as Int
    val top = ratioAndPadding["top"] as Int
    val resizeRatio = ratioAndPadding["resizeRatio"] as Float
    val resizedImg = ImageProcessor.resizeWithPadding(
      imgGray,
      desiredWidth,
      desiredHeight
    )

    for (box in bBoxesList) {
      var croppedImage = RecognizerUtils.getCroppedImage(box, resizedImg, modelHeight)
      if (croppedImage.empty()) {
        continue
      }

      croppedImage = RecognizerUtils.normalizeForRecognizer(croppedImage, adjustContrast)

      var result = runModel(croppedImage)
      var confidenceScore = result.second

      if (confidenceScore < lowConfidenceThreshold) {
        Core.rotate(croppedImage, croppedImage, Core.ROTATE_180)
        val rotatedResult = runModel(croppedImage)
        val rotatedConfidenceScore = rotatedResult.second
        if (rotatedConfidenceScore > confidenceScore) {
          result = rotatedResult
          confidenceScore = rotatedConfidenceScore
        }
      }

      val predIndex = result.first
      val decodedTexts = converter.decodeGreedy(predIndex, predIndex.size)

      val bbox = Array(4) { BBoxPoint(0.0, 0.0) }
      for (i in 0 until 4) {
        bbox[i] = BBoxPoint(
          ((box.bBox[i].x - left) * resizeRatio),
          ((box.bBox[i].y - top) * resizeRatio)
        )
      }

      Log.d("rn_executorch", "confidenceScore: $confidenceScore")
      val resMap = Arguments.createMap()
      val bboxArray = Arguments.createArray()
      bbox.forEach { point ->
        val pointMap = Arguments.createMap()
        pointMap.putDouble("x", point.x)
        pointMap.putDouble("y", point.y)
        bboxArray.pushMap(pointMap)
      }
      resMap.putString("text", decodedTexts[0])
      resMap.putArray("bbox", bboxArray)
      resMap.putDouble("confidence", confidenceScore)

      res.pushMap(resMap)
    }

    return res
  }
}
