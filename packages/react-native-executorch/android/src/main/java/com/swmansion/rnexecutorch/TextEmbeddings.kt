package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableNativeArray
import com.swmansion.rnexecutorch.models.textEmbeddings.TextEmbeddingsModel
import com.swmansion.rnexecutorch.utils.ETError

class TextEmbeddings(
  reactContext: ReactApplicationContext,
) : NativeTextEmbeddingsSpec(reactContext) {
  private lateinit var textEmbeddingsModel: TextEmbeddingsModel

  companion object {
    const val NAME = "TextEmbeddings"
  }

  override fun loadModule(
    modelSource: String,
    tokenizerSource: String,
    promise: Promise,
  ) {
    try {
      textEmbeddingsModel = TextEmbeddingsModel(reactApplicationContext)

      textEmbeddingsModel.loadModel(modelSource)
      textEmbeddingsModel.loadTokenizer(tokenizerSource)

      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun forward(
    input: String,
    promise: Promise,
  ) {
    try {
      val output = textEmbeddingsModel.runModel(input)
      val writableArray = WritableNativeArray()
      output.forEach { writableArray.pushDouble(it) }

      promise.resolve(writableArray)
    } catch (e: Exception) {
      promise.reject(e.message!!, e.message)
    }
  }

  override fun getName(): String = NAME
}
