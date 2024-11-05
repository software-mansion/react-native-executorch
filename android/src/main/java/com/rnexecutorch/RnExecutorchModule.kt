package com.swmansion.rnexecutorch

import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.OkHttpClient
import okhttp3.Request
import org.pytorch.executorch.LlamaModule
import org.pytorch.executorch.LlamaCallback
import java.io.File
import java.net.URL

class RnExecutorchModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), LlamaCallback {
  private var llamaModule: LlamaModule? = null
  private var eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? = null
  private var listenerCount = 0
  private var tempLlamaResponse = StringBuilder()
  private lateinit var conversationManager: ConversationManager
  private val client = OkHttpClient()
  private var isFetching = false

  override fun getName(): String {
    return NAME
  }

  override fun initialize() {
    super.initialize()
    eventEmitter =
      reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  }

  @ReactMethod
  fun addListener(eventName: String) {
    listenerCount++
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    listenerCount -= count
  }

  override fun onResult(result: String) {
    this.eventEmitter?.emit("onToken", result)
    this.tempLlamaResponse.append(result)
  }

  override fun onStats(tps: Float) {
    Log.d("rn_executorch", "TPS: $tps")
  }

  private fun updateDownloadProgress(progress: Float) {
    this.eventEmitter?.emit("onDownloadProgress", progress / 100)
  }

  private fun downloadResource(
    url: URL,
    resourceType: ResourceType,
    callback: (path: String?, error: Exception?) -> Unit
  ) {
    Fetcher.downloadResource(
      reactApplicationContext, client, url, resourceType,
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

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  @ReactMethod
  fun loadLLM(
    modelSource: String,
    tokenizerSource: String,
    systemPrompt: String,
    contextWindowLength: Int,
    promise: Promise
  ) {
    if (llamaModule != null || isFetching) {
      promise.reject("Model already loaded", "Model is already loaded or fetching")
      return
    }

    try {
      val modelURL = URL(modelSource)
      val tokenizerURL = URL(tokenizerSource)
      this.conversationManager = ConversationManager(contextWindowLength, systemPrompt)

      isFetching = true

      downloadResource(
        tokenizerURL,
        ResourceType.TOKENIZER
      ) tokenizerDownload@{ tokenizerPath, error ->
        if (error != null) {
          promise.reject("Download Error", "Tokenizer download failed: ${error.message}")
          isFetching = false
          return@tokenizerDownload
        }

        downloadResource(modelURL, ResourceType.MODEL) modelDownload@{ modelPath, modelError ->
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

  @RequiresApi(Build.VERSION_CODES.N)
  @ReactMethod
  fun runInference(
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

      // We want to add the LLM reponse to the conversation once all the tokens are generated.
      // Each token is appended to the tempLlamaResponse StringBuilder in onResult callback.
      this.conversationManager.addResponse(this.tempLlamaResponse.toString(), ChatRole.ASSISTANT)
      this.tempLlamaResponse.clear()
      Log.d("ExecutorchLib", this.conversationManager.getConversation())
    }.start()

    promise.resolve("Inference completed successfully")
  }

  @ReactMethod
  fun interrupt() {
    llamaModule!!.stop()
  }

  @ReactMethod
  fun deleteModule() {
    llamaModule = null
  }

  companion object {
    const val NAME = "RnExecutorch"
  }
}
