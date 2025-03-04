package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.speechToText.BaseS2TDecoder
import com.swmansion.rnexecutorch.models.speechToText.BaseS2TModule
import com.swmansion.rnexecutorch.models.speechToText.Moonshine
import com.swmansion.rnexecutorch.models.speechToText.MoonshineEncoder
import com.swmansion.rnexecutorch.models.speechToText.Whisper
import com.swmansion.rnexecutorch.models.speechToText.WhisperEncoder
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.ETError
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Tensor

class SpeechToText(reactContext: ReactApplicationContext) : NativeSpeechToTextSpec(reactContext) {

  private lateinit var speechToTextModule: BaseS2TModule;

  companion object {
    const val NAME = "SpeechToText"
  }

  override fun loadModule(modelName: String, modelSources: ReadableArray, promise: Promise): Unit {
    Log.i("rn_executorch", "encoder: ${modelSources.getString(0)!!}, decoder: ${modelSources.getString(1)!!}")
    Log.i("rn_executorch", "${modelName}")
    try {
      if(modelName == "moonshine") {
        this.speechToTextModule = Moonshine(modelName)
        this.speechToTextModule.encoder = MoonshineEncoder(reactApplicationContext)
      }
      if(modelName == "whisper") {
        this.speechToTextModule = Whisper(modelName)
        this.speechToTextModule.encoder = WhisperEncoder(reactApplicationContext)
      }
      this.speechToTextModule.decoder = BaseS2TDecoder(reactApplicationContext)
    } catch(e: Exception){
      Log.i("rn_executorch", "${e.message}")
    }


    try {
      Log.i("rn_executorch", "encoder: ${modelSources.getString(0)!!}, decoder: ${modelSources.getString(1)!!}")
      Log.i("rn_executorch", this.speechToTextModule.toString())
      this.speechToTextModule.loadModel(modelSources.getString(0)!!, modelSources.getString(1)!!)
      promise.resolve(0)
      Log.i("rn_executorch", "loaded")
    } catch (e: Exception) {
      Log.i("rn_executorch", "error")
      promise.reject(e.message!!, ETError.InvalidModelSource.toString())
    }
  }

  override fun generate(waveform: ReadableArray, promise: Promise) {
    val encoding = this.speechToTextModule.encode(waveform)
    val generatedTokens = mutableListOf(this.speechToTextModule.START_TOKEN)
    var lastToken = 0
    Thread {
      while (lastToken != this.speechToTextModule.EOS_TOKEN) {
        lastToken = this.speechToTextModule.decode(generatedTokens, encoding)
        emitOnToken(lastToken.toDouble())
        generatedTokens.add(lastToken)
      }
      val generatedTokensReadableArray =
        ArrayUtils.createReadableArrayFromIntArray(generatedTokens.toIntArray())
      promise.resolve(generatedTokensReadableArray)
    }.start()
  }

  override fun encode(waveform: ReadableArray, promise: Promise) {
    promise.resolve(this.speechToTextModule.encode(waveform).toDoubleList())
  }

  override fun decode(prevTokens: ReadableArray, encoderOutput: ReadableArray, promise: Promise): Unit {
    val size = encoderOutput.size()
    val inputFloatArray = FloatArray(size)
    for (i in 0 until size) {
      inputFloatArray[i] = prevTokens.getDouble(i).toFloat()
    }
    val encoderOutputEValue = EValue.from(Tensor.fromBlob(inputFloatArray, longArrayOf(1,
      (size/288).toLong(), 288)))
    val preTokensMArray = mutableListOf<Int>()
    for (i in 0 until prevTokens.size()) {
      preTokensMArray.add(prevTokens.getLong(i).toInt())
    }
    promise.resolve(this.speechToTextModule.decode(preTokensMArray, encoderOutputEValue))
  }

  override fun getName(): String {
    return NAME
  }
}
