package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.BaseModel
import org.pytorch.executorch.EValue

abstract class BaseS2TModule {
  lateinit var encoder: BaseModel<ReadableArray, Array<EValue>>
  lateinit var decoder: BaseS2TDecoder
  abstract var startToken: Int
  abstract var eosToken: Int

  fun encode(input: ReadableArray): WritableArray {
    val encoderOutput = this.encoder.runModel(input)
    this.decoder.encoderOutput = encoderOutput[0]
    return this.postprocessEncodings(encoderOutput)
  }

  private fun postprocessEncodings(output: Array<EValue>): WritableArray {
    val outputWritableArray: WritableArray = Arguments.createArray()
    output[0].toTensor().dataAsFloatArray.map {
      outputWritableArray.pushDouble(
        it.toDouble(),
      )
    }
    return outputWritableArray
  }

  abstract fun decode(
    prevTokens: ReadableArray,
    encoderOutput: ReadableArray,
  ): Int

  fun loadModel(
    encoderSource: String,
    decoderSource: String,
  ) {
    this.encoder.loadModel(encoderSource)
    this.decoder.loadModel(decoderSource)
  }
}
