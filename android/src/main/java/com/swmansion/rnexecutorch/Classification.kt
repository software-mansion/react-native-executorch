package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.classification.ClassificationModel
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.android.OpenCVLoader
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

class Classification(reactContext: ReactApplicationContext) :
  NativeClassificationSpec(reactContext) {

  private lateinit var classificationModel: ClassificationModel

  companion object {
    const val NAME = "Classification"
    init {
      if(!OpenCVLoader.initLocal()){
        Log.d("rn_executorch", "OpenCV not loaded")
      } else {
        Log.d("rn_executorch", "OpenCV loaded")
      }
    }
  }

  override fun loadModule(modelSource: String, promise: Promise) {
    try {
      classificationModel = ClassificationModel(reactApplicationContext)
      classificationModel.loadModel(modelSource)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun forward(input: String, promise: Promise) {
    try {
      val image = ImageProcessor.readImage(input)
      val output = classificationModel.runModel(image)

      val writableMap: WritableMap = Arguments.createMap()
      
      for ((key, value) in output) {
        writableMap.putDouble(key, value.toDouble())
      }

      promise.resolve(writableMap)
    }catch(e: Exception){
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String {
    return NAME
  }
}
