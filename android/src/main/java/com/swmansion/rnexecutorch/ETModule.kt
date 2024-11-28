package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.Fetcher
import com.swmansion.rnexecutorch.utils.ProgressResponseBody
import com.swmansion.rnexecutorch.utils.ResourceType
import com.swmansion.rnexecutorch.utils.TensorUtils
import okhttp3.OkHttpClient
import org.pytorch.executorch.Module
import org.pytorch.executorch.Tensor
import java.net.URL

class ETModule(reactContext: ReactApplicationContext) : NativeETModuleSpec(reactContext) {
  private lateinit var module: Module
  private val client = OkHttpClient()

  override fun getName(): String {
    return NAME
  }

  private fun downloadModel(
    url: String, resourceType: ResourceType, callback: (path: String?, error: Exception?) -> Unit
  ) {
    Fetcher.downloadResource(reactApplicationContext,
      client,
      url,
      resourceType,
      false,
      { path, error -> callback(path, error) },
      object : ProgressResponseBody.ProgressListener {
        override fun onProgress(bytesRead: Long, contentLength: Long, done: Boolean) {
        }
      })
  }

  override fun loadModule(modelPath: String, promise: Promise) {
    try {
      downloadModel(
        modelPath, ResourceType.MODEL
      ) { path, error ->
        if (error != null) {
          promise.reject(error.message!!, "-1")
          return@downloadModel
        }

        module = Module.load(path)
        promise.resolve(0)
        return@downloadModel
      }
    } catch (e: Exception) {
      promise.reject(e.message!!, "-1")
    }
  }

  override fun loadMethod(methodName: String, promise: Promise) {
    val result = module.loadMethod(methodName)
    if (result != 0) {
      promise.reject("Method loading failed", result.toString())
      return
    }

    promise.resolve(result)
  }

  override fun forward(
    input: ReadableArray,
    shape: ReadableArray,
    inputType: Double,
    promise: Promise
  ) {
    try {
      val executorchInput =
        TensorUtils.getExecutorchInput(input, ArrayUtils.createLongArray(shape), inputType.toInt())

      lateinit var result: Tensor
      module.forward(executorchInput)[0].toTensor().also { result = it }

      promise.resolve(ArrayUtils.createReadableArray(result))
      return
    } catch (e: IllegalArgumentException) {
      //The error is thrown when transformation to Tensor fails
      promise.reject("Forward Failed Execution", "18")
      return
    } catch (e: Exception) {
      //Executorch forward method throws an exception with a message: "Method forward failed with code XX"
      val exceptionCode = e.message!!.substring(e.message!!.length - 2)
      promise.reject("Forward Failed Execution", exceptionCode)
      return
    }
  }

  companion object {
    const val NAME = "ETModule"
  }
}
