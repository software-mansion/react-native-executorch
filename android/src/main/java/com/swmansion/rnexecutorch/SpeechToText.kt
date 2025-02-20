package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.speechToText.WhisperDecoder
import com.swmansion.rnexecutorch.models.speechToText.WhisperEncoder
import com.swmansion.rnexecutorch.models.speechToText.WhisperPreprocessor
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.ETError

class SpeechToText(reactContext: ReactApplicationContext) :
  NativeSpeechToTextSpec(reactContext) {
  private var whisperPreprocessor = WhisperPreprocessor(reactContext)
  private var whisperEncoder = WhisperEncoder(reactContext)
  private var whisperDecoder = WhisperDecoder(reactContext)
  private var START_TOKEN = 50257
  private var EOS_TOKEN = 50256

  companion object {
    const val NAME = "SpeechToText"
  }

  override fun loadModule(preprocessorSource: String, encoderSource: String, decoderSource: String, promise: Promise) {
    try {
      this.whisperPreprocessor.loadModel(preprocessorSource)
      this.whisperEncoder.loadModel(encoderSource)
      this.whisperDecoder.loadModel(decoderSource)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun generate(waveform: ReadableArray, prevTokens: ReadableArray, promise: Promise) {
    val logMel = this.whisperPreprocessor.runModel(waveform)
    val encoding = this.whisperEncoder.runModel(logMel)
    val generatedTokens = mutableListOf(this.START_TOKEN)
    var lastToken = 0
    Thread {
      while (lastToken != this.EOS_TOKEN) {
        this.whisperDecoder.setGeneratedTokens(generatedTokens)
        lastToken = this.whisperDecoder.runModel(encoding)
        emitOnToken(lastToken.toDouble())
        generatedTokens.add(lastToken)
      }
      val generatedTokensReadableArray = ArrayUtils.createReadableArrayFromIntArray(generatedTokens.toIntArray())
      promise.resolve(generatedTokensReadableArray)
    }.start()
  }

  override fun getName(): String {
    return NAME
  }
}
