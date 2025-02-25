package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.llms.ChatRole
import com.swmansion.rnexecutorch.utils.llms.ConversationManager
import com.swmansion.rnexecutorch.utils.llms.END_OF_TEXT_TOKEN
import org.pytorch.executorch.LlamaCallback
import org.pytorch.executorch.LlamaModule
import java.net.URL

class LLM(
  reactContext: ReactApplicationContext,
) : NativeLLMSpec(reactContext),
  LlamaCallback {
  private var llamaModule: LlamaModule? = null
  private var tempLlamaResponse = StringBuilder()
  private lateinit var conversationManager: ConversationManager

  override fun getName(): String = NAME

  override fun initialize() {
    super.initialize()
  }

  override fun onResult(result: String) {
    emitOnToken(result)
    this.tempLlamaResponse.append(result)
  }

  override fun onStats(tps: Float) {
    Log.d("rn_executorch", "TPS: $tps")
  }

  override fun loadLLM(
    modelSource: String,
    tokenizerSource: String,
    systemPrompt: String,
    messageHistory: ReadableArray,
    contextWindowLength: Double,
    promise: Promise,
  ) {
    try {
      this.conversationManager =
        ConversationManager(
          contextWindowLength.toInt(),
          systemPrompt,
          ArrayUtils.createMapArray<String>(messageHistory),
        )
      llamaModule = LlamaModule(1, URL(modelSource).path, URL(tokenizerSource).path, 0.7f)
      this.tempLlamaResponse.clear()
      promise.resolve("Model loaded successfully")
    } catch (e: Exception) {
      promise.reject("Model loading failed", e.message)
    }
  }

  override fun runInference(
    input: String,
    promise: Promise,
  ) {
    this.conversationManager.addResponse(input, ChatRole.USER)
    val conversation = this.conversationManager.getConversation()

    Thread {
      llamaModule!!.generate(conversation, (conversation.length * 0.75).toInt() + 64, this, false)

      // When we call .interrupt(), the LLM doesn't produce EOT token, that also could happen when the
      // generated sequence length is larger than specified in the JNI callback, hence we check if EOT
      // is there and if not, we append it to the output and emit the EOT token to the JS side.
      if (!this.tempLlamaResponse.endsWith(END_OF_TEXT_TOKEN)) {
        this.onResult(END_OF_TEXT_TOKEN)
      }

      // We want to add the LLM response to the conversation once all the tokens are generated.
      // Each token is appended to the tempLlamaResponse StringBuilder in onResult callback.
      this.conversationManager.addResponse(this.tempLlamaResponse.toString(), ChatRole.ASSISTANT)
      this.tempLlamaResponse.clear()
      Log.d("ExecutorchLib", this.conversationManager.getConversation())
    }.start()

    promise.resolve("Inference completed successfully")
  }

  override fun interrupt() {
    llamaModule!!.stop()
  }

  override fun deleteModule() {
    llamaModule = null
  }

  companion object {
    const val NAME = "LLM"
  }
}
