package com.swmansion.rnexecutorch.models.speechToText

import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module
import java.net.URL


abstract class BaseS2TModule(modelName: String) {
  lateinit var encoder: BaseModel<ReadableArray, EValue>
  lateinit var decoder: BaseS2TDecoder
  abstract var START_TOKEN:Int
  abstract var EOS_TOKEN:Int

  fun encode(input: ReadableArray): EValue {
    return this.encoder.runModel(input)
  }

  fun decode(prevTokens: MutableList<Int>, encoderOutput: EValue): Int {
    this.decoder.setGeneratedTokens(prevTokens)
    return this.decoder.runModel(encoderOutput)
  }

  fun loadModel(encoderSource: String, decoderSource: String) {
    Log.i("rn_executorch", "encoder $encoderSource ${URL(encoderSource).path} ${Module.load(URL(encoderSource).path)}")
    try {

      Log.i("rn_executorch", "encoder loaded decoder")
      Log.i("rn_executorch", "encoder loaded decoder: ${this.decoder}")
      Log.i("rn_executorch", "encoder loaded encoder: ${this.encoder}")
      Log.i("rn_executorch", "encoder loaded decoder: ${this.decoder}")
    } catch(e: Exception){
      Log.i("rn_executorch", "error: ${e.message}")
    }

    this.encoder.loadModel(encoderSource)
    Log.i("rn_executorch", "decoder $decoderSource ${URL(decoderSource).path}")
    this.decoder.loadModel(decoderSource)
    Log.i("rn_executorch", "both")
  }

}
