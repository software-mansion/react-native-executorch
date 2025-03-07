package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.BaseModel

abstract class BaseS2TModule {
  lateinit var encoder: BaseModel<ReadableArray, WritableArray>
  lateinit var decoder: BaseS2TDecoder
  abstract var startToken: Int
  abstract var eosToken: Int

  fun encode(input: ReadableArray): WritableArray = this.encoder.runModel(input)

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
