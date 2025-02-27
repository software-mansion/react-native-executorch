package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.speechToText.WhisperDecoder
import com.swmansion.rnexecutorch.models.speechToText.WhisperEncoder
import com.swmansion.rnexecutorch.utils.ArrayUtils
import android.util.Log
import com.swmansion.rnexecutorch.utils.ETError

class SpeechToText(reactContext: ReactApplicationContext) :
  NativeSpeechToTextSpec(reactContext) {
  private var whisperEncoder = WhisperEncoder(reactContext)
  private var whisperDecoder = WhisperDecoder(reactContext)
  private var START_TOKEN = 50257
  private var EOS_TOKEN = 50256

  companion object {
    const val NAME = "SpeechToText"
  }

  override fun loadModule(preprocessorSource: String, encoderSource: String, decoderSource: String, promise: Promise) {
    try {
      this.whisperEncoder.loadModel(encoderSource)
      this.whisperDecoder.loadModel(decoderSource)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun generate(waveform: ReadableArray, promise: Promise) {
    var totalTime = 0.0
    val waveformFloatArray = ArrayUtils.createFloatArray(waveform)
    val encodingStartTime = System.nanoTime()
    val encoding = this.whisperEncoder.runModel(waveformFloatArray)
    val encodingEndTime = System.nanoTime()
    Log.d("ExecutorchLib", "Encoding time: ${(encodingEndTime - encodingStartTime) / 1e9}")
    val generatedTokens = mutableListOf(this.START_TOKEN)

    var lastToken = 0
    Thread {
      while (lastToken != this.EOS_TOKEN) {
        this.whisperDecoder.setGeneratedTokens(generatedTokens)
        val decodingStartTime = System.nanoTime()
        lastToken = this.whisperDecoder.runModel(encoding)
        val decodingEndTime = System.nanoTime()
        totalTime += (decodingEndTime - decodingStartTime) / 1e9
        emitOnToken(lastToken.toDouble())
        generatedTokens.add(lastToken)
      }
      Log.d("ExecutorchLib", "Decoding time: ${generatedTokens.size / totalTime}")
      val generatedTokensReadableArray = ArrayUtils.createReadableArrayFromIntArray(generatedTokens.toIntArray())
      promise.resolve(generatedTokensReadableArray)
    }.start()
  }

  override fun getName(): String {
    return NAME
  }
}
