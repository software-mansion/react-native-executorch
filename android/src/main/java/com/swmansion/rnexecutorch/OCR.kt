package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.android.OpenCVLoader
import com.swmansion.rnexecutorch.models.ocr.Detector
import com.swmansion.rnexecutorch.models.ocr.RecognitionHandler
import com.swmansion.rnexecutorch.models.ocr.utils.Constants
import org.opencv.imgproc.Imgproc

class OCR(reactContext: ReactApplicationContext) :
  NativeOCRSpec(reactContext) {

  private lateinit var detector: Detector
  private lateinit var recognitionHandler: RecognitionHandler

  companion object {
    const val NAME = "OCR"
  }

  init {
    if (!OpenCVLoader.initLocal()) {
      Log.d("rn_executorch", "OpenCV not loaded")
    } else {
      Log.d("rn_executorch", "OpenCV loaded")
    }
  }

  override fun loadModule(
    detectorSource: String,
    recognizerSourceLarge: String,
    recognizerSourceMedium: String,
    recognizerSourceSmall: String,
    symbols: String,
    promise: Promise
  ) {
    try {
      detector = Detector(reactApplicationContext)
      detector.loadModel(detectorSource)

      recognitionHandler = RecognitionHandler(
        symbols,
        reactApplicationContext
      )

      recognitionHandler.loadRecognizers(
        recognizerSourceLarge,
        recognizerSourceMedium,
        recognizerSourceSmall
      ) { _, errorRecognizer ->
        if (errorRecognizer != null) {
          throw Error(errorRecognizer.message!!)
        }

        promise.resolve(0)
      }
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun forward(input: String, promise: Promise) {
    try {
      val inputImage = ImageProcessor.readImage(input)
      val bBoxesList = detector.runModel(inputImage)
      val detectorSize = detector.getModelImageSize()
      Imgproc.cvtColor(inputImage, inputImage, Imgproc.COLOR_BGR2GRAY)
      val result = recognitionHandler.recognize(
        bBoxesList,
        inputImage,
        (detectorSize.width * Constants.RECOGNIZER_RATIO).toInt(),
        (detectorSize.height * Constants.RECOGNIZER_RATIO).toInt()
      )
      promise.resolve(result)
    } catch (e: Exception) {
      Log.d("rn_executorch", "Error running model: ${e.message}")
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String {
    return NAME
  }
}
