package com.swmansion.rnexecutorch

import android.media.Image
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.android.OpenCVLoader
import com.swmansion.rnexecutorch.models.ocr.Detector
import com.swmansion.rnexecutorch.models.ocr.Recognizer
import com.swmansion.rnexecutorch.models.ocr.utils.CTCLabelConverter
import com.swmansion.rnexecutorch.models.ocr.utils.DetectorUtils
import com.swmansion.rnexecutorch.models.ocr.utils.RecognizerUtils
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.imgproc.Imgproc

class VerticalOCR(reactContext: ReactApplicationContext) :
  NativeVerticalOCRSpec(reactContext) {

  private lateinit var detectorLarge: Detector
  private lateinit var detectorNarrow: Detector
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
      detectorLarge = Detector(true, false, reactApplicationContext)
      detectorLarge.loadModel(detectorLargeSource)
      detectorNarrow = Detector(true, true, reactApplicationContext)
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

      val resizedImage = ImageProcessor.resizeWithPadding(inputImage, 1280, 1280)
      val predictions = Arguments.createArray()
      for (box in result) {
        val coords = box.bBox
        val boxWidth = coords[2].x - coords[0].x
        val boxHeight = coords[2].y - coords[0].y
        val points = arrayOfNulls<Point>(4)

        for (i in 0 until 4) {
          points.set(i, Point(coords[i].x, coords[i].y))
        }

        val boundingBox = Imgproc.boundingRect(MatOfPoint(*points))
        val croppedImage = Mat(resizedImage, boundingBox)

        val ratioAndPadding = RecognizerUtils.calculateResizeRatioAndPaddings(
          inputImage.width(),
          inputImage.height(),
          1280,
          1280
        )

        var text = ""
        var confidenceScore = 0.0
        var detectionResult = detectorNarrow.runModel(croppedImage)

        var croppedCharacters = mutableListOf<Mat>()

        for (bbox in detectionResult) {
          val coords2 = bbox.bBox
          var paddingsSingle = RecognizerUtils.calculateResizeRatioAndPaddings(
            boxWidth.toInt(), boxHeight.toInt(), 320, 1280
          )

          var croppedCharacter = RecognizerUtils.cropImageWithBoundingBox(
            inputImage,
            coords2,
            coords,
            paddingsSingle,
            ratioAndPadding
          )
          if (this.independentCharacters) {
            croppedCharacter = RecognizerUtils.normalizeForRecognizer(croppedCharacter, 0.0)
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
          confidenceScore /= detectionResult.size
        } else {
          var mergedCharacters = Mat()
          Core.hconcat(croppedCharacters, mergedCharacters)
          mergedCharacters = ImageProcessor.resizeWithPadding(mergedCharacters, 512, 64)
          mergedCharacters = RecognizerUtils.normalizeForRecognizer(mergedCharacters, 0.0)

          val recognitionResult = recognizer.runModel(mergedCharacters)
          val predIndex = recognitionResult.first
          val decodedText = converter.decodeGreedy(predIndex, predIndex.size)

          text = decodedText[0]
          confidenceScore = recognitionResult.second
        }

        for (bBox in box.bBox) {
          bBox.x =
            (bBox.x - ratioAndPadding["left"] as Int) * ratioAndPadding["resizeRatio"] as Float
          bBox.y =
            (bBox.y - ratioAndPadding["top"] as Int) * ratioAndPadding["resizeRatio"] as Float
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
