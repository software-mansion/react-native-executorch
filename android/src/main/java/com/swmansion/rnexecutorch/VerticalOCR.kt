package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.android.OpenCVLoader
import com.swmansion.rnexecutorch.models.ocr.Recognizer
import com.swmansion.rnexecutorch.models.ocr.VerticalDetector
import com.swmansion.rnexecutorch.models.ocr.utils.CTCLabelConverter
import com.swmansion.rnexecutorch.models.ocr.utils.Constants
import com.swmansion.rnexecutorch.models.ocr.utils.RecognizerUtils
import org.opencv.core.Core
import org.opencv.core.Mat

class VerticalOCR(reactContext: ReactApplicationContext) :
  NativeVerticalOCRSpec(reactContext) {

  private lateinit var detectorLarge: VerticalDetector
  private lateinit var detectorNarrow: VerticalDetector
  private lateinit var recognizer: Recognizer
  private lateinit var converter: CTCLabelConverter
  private var independentCharacters = true

  companion object {
    const val NAME = "VerticalOCR"
  }

  init {
    if (!OpenCVLoader.initLocal()) {
      Log.d("rn_executorch", "OpenCV not loaded")
    } else {
      Log.d("rn_executorch", "OpenCV loaded")
    }
  }

  override fun loadModule(
    detectorLargeSource: String,
    detectorNarrowSource: String,
    recognizerSource: String,
    symbols: String,
    independentCharacters: Boolean,
    promise: Promise
  ) {
    try {
      this.independentCharacters = independentCharacters
      detectorLarge = VerticalDetector(false, reactApplicationContext)
      detectorLarge.loadModel(detectorLargeSource)
      detectorNarrow = VerticalDetector(true, reactApplicationContext)
      detectorNarrow.loadModel(detectorNarrowSource)
      recognizer = Recognizer(reactApplicationContext)
      recognizer.loadModel(recognizerSource)

      converter = CTCLabelConverter(symbols)

      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun forward(input: String, promise: Promise) {
    try {
      val inputImage = ImageProcessor.readImage(input)
      val result = detectorLarge.runModel(inputImage)
      val largeDetectorSize = detectorLarge.getModelImageSize()
      val resizedImage = ImageProcessor.resizeWithPadding(
        inputImage,
        largeDetectorSize.width.toInt(),
        largeDetectorSize.height.toInt()
      )
      val predictions = Arguments.createArray()
      for (box in result) {
        val cords = box.bBox
        val boxWidth = cords[2].x - cords[0].x
        val boxHeight = cords[2].y - cords[0].y

        val boundingBox = RecognizerUtils.extractBoundingBox(cords)
        val croppedImage = Mat(resizedImage, boundingBox)

        val paddings = RecognizerUtils.calculateResizeRatioAndPaddings(
          inputImage.width(),
          inputImage.height(),
          largeDetectorSize.width.toInt(),
          largeDetectorSize.height.toInt()
        )

        var text = ""
        var confidenceScore = 0.0
        val boxResult = detectorNarrow.runModel(croppedImage)
        val narrowDetectorSize = detectorNarrow.getModelImageSize()

        val croppedCharacters = mutableListOf<Mat>()

        for (characterBox in boxResult) {
          val boxCords = characterBox.bBox
          val paddingsBox = RecognizerUtils.calculateResizeRatioAndPaddings(
            boxWidth.toInt(),
            boxHeight.toInt(),
            narrowDetectorSize.width.toInt(),
            narrowDetectorSize.height.toInt()
          )

          var croppedCharacter = RecognizerUtils.cropImageWithBoundingBox(
            inputImage,
            boxCords,
            cords,
            paddingsBox,
            paddings
          )

          if (this.independentCharacters) {
            croppedCharacter = RecognizerUtils.normalizeForRecognizer(croppedCharacter, 0.0, true)
            val recognitionResult = recognizer.runModel(croppedCharacter)
            val predIndex = recognitionResult.first
            val decodedText = converter.decodeGreedy(predIndex, predIndex.size)
            text += decodedText[0]
            confidenceScore += recognitionResult.second
          } else {
            croppedCharacters.add(croppedCharacter)
          }
        }

        if (this.independentCharacters) {
          confidenceScore /= boxResult.size
        } else {
          var mergedCharacters = Mat()
          Core.hconcat(croppedCharacters, mergedCharacters)
          mergedCharacters = ImageProcessor.resizeWithPadding(
            mergedCharacters,
            Constants.LARGE_MODEL_WIDTH,
            Constants.MODEL_HEIGHT
          )
          mergedCharacters = RecognizerUtils.normalizeForRecognizer(mergedCharacters, 0.0)

          val recognitionResult = recognizer.runModel(mergedCharacters)
          val predIndex = recognitionResult.first
          val decodedText = converter.decodeGreedy(predIndex, predIndex.size)

          text = decodedText[0]
          confidenceScore = recognitionResult.second
        }

        for (bBox in box.bBox) {
          bBox.x =
            (bBox.x - paddings["left"] as Int) * paddings["resizeRatio"] as Float
          bBox.y =
            (bBox.y - paddings["top"] as Int) * paddings["resizeRatio"] as Float
        }

        val resMap = Arguments.createMap()

        resMap.putString("text", text)
        resMap.putArray("bbox", box.toWritableArray())
        resMap.putDouble("confidence", confidenceScore)

        predictions.pushMap(resMap)
      }

      promise.resolve(predictions)
    } catch (e: Exception) {
      Log.d("rn_executorch", "Error running model: ${e.message}")
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String {
    return NAME
  }
}
