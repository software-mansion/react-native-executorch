package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.speechtotext.BaseS2TModule
import com.swmansion.rnexecutorch.models.speechtotext.Moonshine
import com.swmansion.rnexecutorch.models.speechtotext.MoonshineDecoder
import com.swmansion.rnexecutorch.models.speechtotext.MoonshineEncoder
import com.swmansion.rnexecutorch.models.speechtotext.Whisper
import com.swmansion.rnexecutorch.models.speechtotext.WhisperDecoder
import com.swmansion.rnexecutorch.models.speechtotext.WhisperEncoder
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.writableArrayToEValue
import com.swmansion.rnexecutorch.utils.ETError

class SpeechToText(
  reactContext: ReactApplicationContext,
) : NativeSpeechToTextSpec(reactContext) {
  private lateinit var speechToTextModule: BaseS2TModule

  companion object {
    const val NAME = "SpeechToText"
  }

  override fun loadModule(
    modelName: String,
    modelSources: ReadableArray,
    promise: Promise,
  ) {
    try {
      if (modelName == "moonshine") {
        this.speechToTextModule = Moonshine()
        this.speechToTextModule.encoder = MoonshineEncoder(reactApplicationContext)
        this.speechToTextModule.decoder = MoonshineDecoder(reactApplicationContext)
      }
      if (modelName == "whisper") {
        this.speechToTextModule = Whisper()
        this.speechToTextModule.encoder = WhisperEncoder(reactApplicationContext)
        this.speechToTextModule.decoder = WhisperDecoder(reactApplicationContext)
      }
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
      return
    }

    try {
      this.speechToTextModule.loadModel(modelSources.getString(0)!!, modelSources.getString(1)!!)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun generate(
    waveform: ReadableArray,
    promise: Promise,
  ) {
    val encoding = writableArrayToEValue(this.speechToTextModule.encode(waveform))
    val generatedTokens = mutableListOf(this.speechToTextModule.startToken)
    var lastToken = 0
    Thread {
      while (lastToken != this.speechToTextModule.eosToken) {
        // TODO uncomment, for now
        //        lastToken = this.speechToTextModule.decode(generatedTokens, encoding)
        emitOnToken(lastToken.toDouble())
        generatedTokens.add(lastToken)
      }
      val generatedTokensReadableArray =
        ArrayUtils.createReadableArrayFromIntArray(generatedTokens.toIntArray())
      promise.resolve(generatedTokensReadableArray)
    }.start()
  }

  override fun encode(
    waveform: ReadableArray,
    promise: Promise,
  ) {
    promise.resolve(this.speechToTextModule.encode(waveform))
  }

  override fun decode(
    prevTokens: ReadableArray,
    encoderOutput: ReadableArray,
    promise: Promise,
  ) {
    promise.resolve(this.speechToTextModule.decode(prevTokens, encoderOutput))
  }

  override fun getName(): String = NAME
}
