package com.swmansion.rnexecutorch.models.speechToText

import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils

class Whisper : BaseS2TModule() {
  override var START_TOKEN = 50257
  override var EOS_TOKEN = 50256
  override fun decode(prevTokens: ReadableArray, encoderOutput: ReadableArray): Int {
    this.decoder.setGeneratedTokens(prevTokens)
    return this.decoder.runModel(encoderOutput)
  }
}
