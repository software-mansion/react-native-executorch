package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createIntArray
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createReadableArrayFromIntArray
import com.swmansion.rnexecutorch.utils.ETError
import org.pytorch.executorch.HuggingFaceTokenizer
import java.net.URL

class Tokenizer(
  reactContext: ReactApplicationContext,
) : NativeTokenizerSpec(reactContext) {
  private lateinit var tokenizer: HuggingFaceTokenizer

  companion object {
    const val NAME = "Tokenizer"
  }

  override fun load(
    tokenizerSource: String,
    promise: Promise,
  ) {
    try {
      tokenizer = HuggingFaceTokenizer(URL(tokenizerSource).path)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun decode(
    input: ReadableArray,
    promise: Promise,
  ) {
    promise.resolve(tokenizer.decode(createIntArray(input)))
  }

  override fun encode(
    input: String,
    promise: Promise,
  ) {
    promise.resolve(createReadableArrayFromIntArray(tokenizer.encode(input)))
  }

  override fun getVocabSize(promise: Promise) {
    promise.resolve(tokenizer.vocabSize)
  }

  override fun idToToken(
    id: Double,
    promise: Promise,
  ) {
    promise.resolve(tokenizer.idToToken(id.toInt()))
  }

  override fun tokenToId(
    token: String,
    promise: Promise,
  ) {
    promise.resolve(tokenizer.tokenToId(token))
  }

  override fun getName(): String = NAME
}
