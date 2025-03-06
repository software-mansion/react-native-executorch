package com.swmansion.rnexecutorch.models.speechtotext

import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils

class Moonshine : BaseS2TModule() {
  override var START_TOKEN = 1
  override var EOS_TOKEN = 2
  override fun decode(prevTokens: ReadableArray, encoderOutput: ReadableArray): Int {
    this.decoder.setGeneratedTokens(prevTokens)
    return this.decoder.runModel(encoderOutput)
  }
}
