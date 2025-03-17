package com.swmansion.rnexecutorch.models.speechtotext

import android.util.Log
import com.facebook.react.bridge.ReadableArray

class Moonshine : BaseS2TModule() {
  override var startToken = 1
  override var eosToken = 2

  override fun decode(
    prevTokens: ReadableArray,
    encoderOutput: ReadableArray,
  ): Int {
    Log.i("rn_executorch", "Moonshine:decode")

    this.decoder.setGeneratedTokens(prevTokens)
    return this.decoder.runModel(encoderOutput)
  }
}
