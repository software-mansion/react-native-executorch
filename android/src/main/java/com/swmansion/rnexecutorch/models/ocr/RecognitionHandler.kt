package com.swmansion.rnexecutorch.models.ocr

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.ocr.utils.CTCLabelConverter
import com.swmansion.rnexecutorch.models.ocr.utils.Constants
import com.swmansion.rnexecutorch.models.ocr.utils.OCRbBox
import com.swmansion.rnexecutorch.models.ocr.utils.RecognizerUtils
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.core.Core
import org.opencv.core.Mat

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
    val result: Pair<List<Int>, Double> = if (croppedImage.cols() >= Constants.LARGE_MODEL_WIDTH) {
      recognizerLarge.runModel(croppedImage)
    } else if (croppedImage.cols() >= Constants.MEDIUM_MODEL_WIDTH) {
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
      var croppedImage = RecognizerUtils.getCroppedImage(box, resizedImg, Constants.MODEL_HEIGHT)
      if (croppedImage.empty()) {
        continue
      }

      croppedImage = RecognizerUtils.normalizeForRecognizer(croppedImage, Constants.ADJUST_CONTRAST)

      var result = runModel(croppedImage)
      var confidenceScore = result.second

      if (confidenceScore < Constants.LOW_CONFIDENCE_THRESHOLD) {
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

      for (bBox in box.bBox) {
        bBox.x = (bBox.x - left) * resizeRatio
        bBox.y = (bBox.y - top) * resizeRatio
      }

      val resMap = Arguments.createMap()

      resMap.putString("text", decodedTexts[0])
      resMap.putArray("bbox", box.toWritableArray())
      resMap.putDouble("confidence", confidenceScore)

      res.pushMap(resMap)
    }

    return res
  }
}
