package com.swmansion.rnexecutorch.models.speechToText

class Whisper: BaseS2TModule() {
  override var START_TOKEN = 50257
  override var EOS_TOKEN = 50256
}
