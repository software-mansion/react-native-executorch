package com.swmansion.rnexecutorch.models.speechToText

class Whisper(
  modelName: String,
): BaseS2TModule(modelName) {
  override var START_TOKEN = 50257
  override var EOS_TOKEN = 50256
}
