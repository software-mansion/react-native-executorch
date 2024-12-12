package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.swmansion.rnexecutorch.utils.Fetcher
import com.swmansion.rnexecutorch.utils.ProgressResponseBody
import com.swmansion.rnexecutorch.utils.ResourceType
import com.swmansion.rnexecutorch.utils.llms.ChatRole
import com.swmansion.rnexecutorch.utils.llms.ConversationManager
import com.swmansion.rnexecutorch.utils.llms.END_OF_TEXT_TOKEN
import org.pytorch.executorch.LlamaCallback
import org.pytorch.executorch.LlamaModule

class LLM(reactContext: ReactApplicationContext) :
  NativeLLMSpec(reactContext), LlamaCallback {

  private var llamaModule: LlamaModule? = null
  private var tempLlamaResponse = StringBuilder()
  private lateinit var conversationManager: ConversationManager
  private var isFetching = false

  override fun getName(): String {
    return NAME
  }

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

  private fun updateDownloadProgress(progress: Float) {
    emitOnDownloadProgress((progress / 100).toDouble())
  }

  private fun downloadResource(
    url: String,
    resourceType: ResourceType,
    isLargeFile: Boolean = false,
    callback: (path: String?, error: Exception?) -> Unit,
  ) {
    Fetcher.downloadResource(
      reactApplicationContext, url, resourceType, isLargeFile,
      { path, error -> callback(path, error) },
      object : ProgressResponseBody.ProgressListener {
        override fun onProgress(bytesRead: Long, contentLength: Long, done: Boolean) {
          val progress = (bytesRead * 100 / contentLength).toFloat()
          updateDownloadProgress(progress)
          if (done) {
            isFetching = false
          }
        }
      })
  }

  private fun initializeLlamaModule(modelPath: String, tokenizerPath: String, promise: Promise) {
    llamaModule = LlamaModule(1, modelPath, tokenizerPath, 0.7f)
    isFetching = false
    promise.resolve("Model loaded successfully")
  }

  override fun loadLLM(
    modelSource: String,
    tokenizerSource: String,
    systemPrompt: String,
    contextWindowLength: Double,
    promise: Promise
  ) {
    if (llamaModule != null || isFetching) {
      promise.reject("Model already loaded", "Model is already loaded or fetching")
      return
    }

    try {
      this.conversationManager = ConversationManager(contextWindowLength.toInt(), systemPrompt)

      isFetching = true

      downloadResource(
        tokenizerSource,
        ResourceType.TOKENIZER
      ) tokenizerDownload@{ tokenizerPath, error ->
        if (error != null) {
          promise.reject("Download Error", "Tokenizer download failed: ${error.message}")
          isFetching = false
          return@tokenizerDownload
        }

        downloadResource(
          modelSource,
          ResourceType.MODEL,
          isLargeFile = true
        ) modelDownload@{ modelPath, modelError ->
          if (modelError != null) {
            promise.reject(
              "Download Error",
              "Model download failed: ${modelError.message}"
            )
            isFetching = false
            return@modelDownload
          }

          initializeLlamaModule(modelPath!!, tokenizerPath!!, promise)
        }
      }
    } catch (e: Exception) {
      promise.reject("Download Error", e.message)
      isFetching = false
    }
  }

  override fun runInference(
    input: String,
    promise: Promise
  ) {
    this.conversationManager.addResponse(input, ChatRole.USER)
    val conversation = this.conversationManager.getConversation()

    Thread {
      llamaModule!!.generate(conversation, (conversation.length * 0.75).toInt() + 64, this, false)

      // When we call .interrupt(), the LLM doesn't produce EOT token, that also could happen when the
      // generated sequence length is larger than specified in the JNI callback, hence we check if EOT
      // is there and if not, we append it to the output and emit the EOT token to the JS side.
      if (!this.tempLlamaResponse.endsWith(END_OF_TEXT_TOKEN)) {
        this.onResult(END_OF_TEXT_TOKEN);
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
