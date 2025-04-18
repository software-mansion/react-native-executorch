package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.ReadableArray

class Whisper : BaseS2TModule() {
  override var startToken = 50257
  override var eosToken = 50256

  override fun decode(
    prevTokens: ReadableArray,
    encoderOutput: ReadableArray,
  ): Int {
    this.decoder.setGeneratedTokens(prevTokens)
    return this.decoder.runModel(encoderOutput)
  }
}
