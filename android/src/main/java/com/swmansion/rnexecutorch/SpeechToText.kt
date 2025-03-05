package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.speechToText.BaseS2TDecoder
import com.swmansion.rnexecutorch.models.speechToText.BaseS2TModule
import com.swmansion.rnexecutorch.models.speechToText.Moonshine
import com.swmansion.rnexecutorch.models.speechToText.MoonshineEncoder
import com.swmansion.rnexecutorch.models.speechToText.Whisper
import com.swmansion.rnexecutorch.models.speechToText.WhisperEncoder
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.ArrayUtils.Companion.createFloatArray
import com.swmansion.rnexecutorch.utils.ETError
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class SpeechToText(reactContext: ReactApplicationContext) : NativeSpeechToTextSpec(reactContext) {

  private lateinit var speechToTextModule: BaseS2TModule;

  companion object {
    const val NAME = "SpeechToText"
  }

  override fun loadModule(modelName: String, modelSources: ReadableArray, promise: Promise): Unit {
    try {
      if(modelName == "moonshine") {
        this.speechToTextModule = Moonshine()
        this.speechToTextModule.encoder = MoonshineEncoder(reactApplicationContext)
        this.speechToTextModule.decoder = BaseS2TDecoder(reactApplicationContext)
        this.speechToTextModule.decoder.methodName = "forward_cached"
      }
      if(modelName == "whisper") {
        this.speechToTextModule = Whisper()
        this.speechToTextModule.encoder = WhisperEncoder(reactApplicationContext)
        this.speechToTextModule.decoder = BaseS2TDecoder(reactApplicationContext)
        this.speechToTextModule.decoder.methodName = "forward"
      }
    } catch(e: Exception){
    }


    try {
      this.speechToTextModule.loadModel(modelSources.getString(0)!!, modelSources.getString(1)!!)
      promise.resolve(0)
    } catch (e: Exception) {
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun generate(waveform: ReadableArray, promise: Promise) {
    val encoding = this.writableArrayToEValue(this.speechToTextModule.encode(waveform))
    val generatedTokens = mutableListOf(this.speechToTextModule.START_TOKEN)
    var lastToken = 0
    Thread {
      while (lastToken != this.speechToTextModule.EOS_TOKEN) {
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

  private fun writableArrayToEValue(input: WritableArray): EValue {
    val size = input.size()
    val preprocessorInputShape = longArrayOf(1, size.toLong())
    return EValue.from(Tensor.fromBlob(createFloatArray(input), preprocessorInputShape))
  }

  override fun encode(waveform: ReadableArray, promise: Promise) {
    promise.resolve(this.speechToTextModule.encode(waveform))
  }

  override fun decode(prevTokens: ReadableArray, encoderOutput: ReadableArray, promise: Promise) {
    promise.resolve(this.speechToTextModule.decode(prevTokens, encoderOutput))
  }

  override fun getName(): String {
    return NAME
  }
}
