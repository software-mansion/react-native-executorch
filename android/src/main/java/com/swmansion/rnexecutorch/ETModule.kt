package com.swmansion.rnexecutorch

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils
import okhttp3.OkHttpClient
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module
import org.pytorch.executorch.Tensor
import java.net.URL

class ETModule(reactContext: ReactApplicationContext) : NativeETModuleSpec(reactContext) {
  private lateinit var module: Module
  private val client = OkHttpClient()
  private var isFetching = false

  override fun getName(): String {
    return NAME
  }

  private fun downloadResource(
    url: URL, resourceType: ResourceType, callback: (path: String?, error: Exception?) -> Unit
  ) {
    Fetcher.downloadResource(reactApplicationContext,
      client,
      url,
      resourceType,
      { path, error -> callback(path, error) },
      object : ProgressResponseBody.ProgressListener {
        override fun onProgress(bytesRead: Long, contentLength: Long, done: Boolean) {
          if (done) {
            isFetching = false
          }
        }
      })
  }

  override fun loadModule(modelPath: String, promise: Promise) {
    try {
      downloadResource(
        URL(modelPath), ResourceType.MODEL
      ) { path, error ->
        if (error != null) {
          promise.reject(error.message!!, "-1")
          return@downloadResource
        }

        module = Module.load(path)
        promise.resolve(0)
        return@downloadResource
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

  override fun forward(input: ReadableArray, shape: ReadableArray, promise: Promise) {
    try {
      val tensor =
        Tensor.fromBlob(ArrayUtils.createFloatArray(input), ArrayUtils.createLongArray(shape))
      lateinit var result: Tensor
      module.forward(EValue.from(tensor))[0].toTensor().also { result = it }

      val floatResult = result.dataAsFloatArray
      val resultArray = Arguments.createArray()
      floatResult.forEach { float ->
        resultArray.pushDouble(float.toDouble())
      }

      promise.resolve(resultArray)
      return
    } catch (e: IllegalArgumentException) {
      promise.reject(e.message!!, "18")
      return
    } catch (e: Exception) {
      val exceptionCode = e.message!!.substring(e.message!!.length - 2)
      promise.reject(e.message!!, exceptionCode)
      return
    }
  }

  companion object {
    const val NAME = "ETModule"
  }
}
