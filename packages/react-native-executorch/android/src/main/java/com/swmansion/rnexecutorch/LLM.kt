package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import org.pytorch.executorch.extension.llm.LlmCallback
import org.pytorch.executorch.extension.llm.LlmModule

class LLM(
  reactContext: ReactApplicationContext,
) : NativeLLMSpec(reactContext),
  LlmCallback {
  private var llmModule: LlmModule? = null

  override fun getName(): String = NAME

  override fun initialize() {
    super.initialize()
  }

  override fun onResult(result: String) {
    emitOnToken(result)
  }

  override fun onStats(tps: Float) {
    Log.d("rn_executorch", "TPS: $tps")
  }

  override fun loadLLM(
    modelSource: String,
    tokenizerSource: String,
    promise: Promise,
  ) {
    try {
      llmModule = LlmModule(modelSource, tokenizerSource, 0.7f)
      promise.resolve("Model loaded successfully")
    } catch (e: Exception) {
      promise.reject("Model loading failed", e.message)
    }
  }

  override fun forward(
    input: String,
    promise: Promise,
  ) {
    Thread {
      llmModule!!.generate(input, this)
      promise.resolve("Inference completed successfully")
    }.start()
  }

  override fun interrupt() {
    llmModule!!.stop()
  }

  override fun releaseResources() {
    llmModule = null
  }

  companion object {
    const val NAME = "LLM"
  }
}
