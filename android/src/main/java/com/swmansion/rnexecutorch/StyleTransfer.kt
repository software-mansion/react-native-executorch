package com.swmansion.rnexecutorch

import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.models.StyleTransferModel
import com.swmansion.rnexecutorch.utils.BitmapUtils
import com.swmansion.rnexecutorch.utils.ETError

class StyleTransfer(reactContext: ReactApplicationContext) :
  NativeStyleTransferSpec(reactContext) {

  private lateinit var styleTransferModel: StyleTransferModel

  companion object {
    const val NAME = "StyleTransfer"
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
      val uri = Uri.parse(input)
      val bitmapInputStream = reactApplicationContext.contentResolver.openInputStream(uri)
      val rawBitmap = BitmapFactory.decodeStream(bitmapInputStream)
      bitmapInputStream!!.close()

      val output = styleTransferModel.runModel(rawBitmap)
      val outputUri = BitmapUtils.saveToTempFile(output, "test")

      promise.resolve(outputUri.toString())
    }catch(e: Exception){
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String {
    return NAME
  }
}
