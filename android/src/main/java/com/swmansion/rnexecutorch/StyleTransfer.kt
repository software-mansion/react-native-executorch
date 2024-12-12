package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.StyleTransferModel
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.ImageProcessor
import org.opencv.android.OpenCVLoader

class StyleTransfer(reactContext: ReactApplicationContext) :
  NativeStyleTransferSpec(reactContext) {

  private lateinit var styleTransferModel: StyleTransferModel

  companion object {
    const val NAME = "StyleTransfer"

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
      styleTransferModel = StyleTransferModel(reactApplicationContext)
      styleTransferModel.loadModel(modelSource)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelPath.toString())
    }
  }

  override fun forward(input: String, promise: Promise) {
    try {
      val output = styleTransferModel.runModel(ImageProcessor.readImage(input))
      promise.resolve(ImageProcessor.saveToTempFile(reactApplicationContext, output))
    }catch(e: Exception){
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String {
    return NAME
  }
}
