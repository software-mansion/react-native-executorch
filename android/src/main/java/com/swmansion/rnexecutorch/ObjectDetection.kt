package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.android.OpenCVLoader
import com.swmansion.rnexecutorch.models.objectdetection.SSDLiteLargeModel
import org.opencv.core.Mat

class ObjectDetection(reactContext: ReactApplicationContext) :
  NativeObjectDetectionSpec(reactContext) {

  private lateinit var ssdLiteLarge: SSDLiteLargeModel

  companion object {
    const val NAME = "ObjectDetection"
  }

  init {
    if(!OpenCVLoader.initLocal()){
      Log.d("rn_executorch", "OpenCV not loaded")
    } else {
      Log.d("rn_executorch", "OpenCV loaded")
    }
  }

  override fun loadModule(modelSource: String, promise: Promise) {
    try {
      ssdLiteLarge = SSDLiteLargeModel(reactApplicationContext)
      ssdLiteLarge.loadModel(modelSource)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun forward(input: String, promise: Promise) {
    try {
      val inputImage = ImageProcessor.readImage(input)
      val output = ssdLiteLarge.runModel(inputImage)
      val outputWritableArray: WritableArray = Arguments.createArray()
      output.map { detection ->
        detection.toWritableMap()
      }.forEach { writableMap ->
        outputWritableArray.pushMap(writableMap)
      }
      promise.resolve(outputWritableArray)
    } catch(e: Exception){
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String {
    return NAME
  }
}
