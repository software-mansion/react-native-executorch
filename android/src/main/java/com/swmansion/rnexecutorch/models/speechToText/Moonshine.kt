package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.ReadableArray

class Moonshine : BaseS2TModule() {
  override var startToken = 1
  override var eosToken = 2

  override fun decode(
    prevTokens: ReadableArray,
    encoderOutput: ReadableArray,
  ): Int {
    this.decoder.setGeneratedTokens(prevTokens)
    return this.decoder.runModel(encoderOutput)
  }
}
