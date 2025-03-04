package com.swmansion.rnexecutorch.models.speechToText

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.swmansion.rnexecutorch.models.BaseModel
import com.swmansion.rnexecutorch.utils.ArrayUtils


abstract class BaseS2TModule() {
  lateinit var encoder: BaseModel<ReadableArray, WritableArray>
  lateinit var decoder: BaseS2TDecoder
  abstract var START_TOKEN:Int
  abstract var EOS_TOKEN:Int

  fun encode(input: ReadableArray): WritableArray {
    return this.encoder.runModel(input)
  }

  fun decode(prevTokens: ReadableArray, encoderOutput: ReadableArray): Int {
    this.decoder.setGeneratedTokens(ArrayUtils.createLongArray(prevTokens))
    return this.decoder.runModel(encoderOutput)
  }

  fun loadModel(encoderSource: String, decoderSource: String) {
    this.encoder.loadModel(encoderSource)
    this.decoder.loadModel(decoderSource)
  }

}
