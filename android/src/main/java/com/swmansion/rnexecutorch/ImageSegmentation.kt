package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.models.imagesegmentation.ImageSegmentationModel
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.android.OpenCVLoader

class ImageSegmentation(reactContext: ReactApplicationContext) :
  NativeImageSegmentationSpec(reactContext) {

  private lateinit var model: ImageSegmentationModel

  companion object {
    const val NAME = "ImageSegmentation"

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
      model = ImageSegmentationModel(reactApplicationContext)
      model.loadModel(modelSource)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun forward(input: String, 
                       classesOfInterest: ReadableArray,
                       resize:Boolean,
                       promise: Promise) {
    try {
      val output =
          model.runModel(Pair(ImageProcessor.readImage(input), classesOfInterest))
      promise.resolve(output)
    }catch(e: Exception){
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String {
    return NAME
  }
}
