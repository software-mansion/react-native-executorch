package com.swmansion.rnexecutorch.models.speechToText

class Moonshine(
  modelName: String,
) : BaseS2TModule(modelName) {
  override var START_TOKEN = 1
  override var EOS_TOKEN = 2
}
