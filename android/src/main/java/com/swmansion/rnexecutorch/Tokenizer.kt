package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createIntArray
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createReadableArrayFromIntArray
import com.swmansion.rnexecutorch.utils.ETError
import org.pytorch.executorch.HuggingFaceTokenizer

class Tokenizer(
  reactContext: ReactApplicationContext,
) : NativeTokenizerSpec(reactContext) {
  private lateinit var tokenizer: HuggingFaceTokenizer

  companion object {
    const val NAME = "Tokenizer"
  }

  override fun loadModule(
    tokenizerSource: String,
    promise: Promise,
  ) {
    try {
      tokenizer = HuggingFaceTokenizer(tokenizerSource)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun decode(
    input: ReadableArray,
    skipSpecialTokens: Boolean,
    promise: Promise,
  ) {
    try {
      promise.resolve(tokenizer.decode(createIntArray(input), skipSpecialTokens))
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.UndefinedError.toString())
    }
  }

  override fun encode(
    input: String,
    promise: Promise,
  ) {
    try {
      promise.resolve(createReadableArrayFromIntArray(tokenizer.encode(input)))
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.UndefinedError.toString())
    }
  }

  override fun getVocabSize(promise: Promise) {
    try {
      promise.resolve(tokenizer.vocabSize)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.UndefinedError.toString())
    }
  }

  override fun idToToken(
    id: Double,
    promise: Promise,
  ) {
    try {
      promise.resolve(tokenizer.idToToken(id.toInt()))
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.UndefinedError.toString())
    }
  }

  override fun tokenToId(
    token: String,
    promise: Promise,
  ) {
    try {
      promise.resolve(tokenizer.tokenToId(token))
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.UndefinedError.toString())
    }
  }

  override fun getName(): String = NAME
}
