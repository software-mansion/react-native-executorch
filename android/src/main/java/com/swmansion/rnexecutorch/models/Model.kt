package com.swmansion.rnexecutorch.models

import android.content.Context
import com.swmansion.rnexecutorch.utils.Fetcher
import com.swmansion.rnexecutorch.utils.ProgressResponseBody
import com.swmansion.rnexecutorch.utils.ResourceType
import okhttp3.OkHttpClient
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module
import org.pytorch.executorch.Tensor

abstract class Model<Input, Output>(val context: Context) {
  protected lateinit var module: Module
  private val client = OkHttpClient()

  private fun downloadModel(
    url: String, callback: (path: String?, error: Exception?) -> Unit
  ) {
    Fetcher.downloadResource(context,
      client,
      url,
      ResourceType.MODEL,
      false,
      { path, error -> callback(path, error) },
      object : ProgressResponseBody.ProgressListener {
        override fun onProgress(bytesRead: Long, contentLength: Long, done: Boolean) {
        }
      })
  }

  fun loadModel(modelSource: String) {
    try {
      downloadModel(
        modelSource
      ) { path, error ->
        if (error != null) {
          throw Error(error.message!!)
        }

        module = Module.load(path)
      }
    } catch (e: Exception) {
      throw Error(e.message!!)
    }
  }

  fun forward(input: EValue): Tensor {
    try {
      val result: Tensor = module.forward(input)[0].toTensor()
      return result
    } catch (e: IllegalArgumentException) {
      //The error is thrown when transformation to Tensor fails
      throw Error("18")
    } catch (e: Exception) {
      //Executorch forward method throws an exception with a message: "Method forward failed with code XX"
      val exceptionCode = e.message!!.substring(e.message!!.length - 2)
      throw Error(exceptionCode)
    }
  }

  abstract fun runModel(input: Input): Output

  abstract fun preprocess(input: Input): Input

  abstract fun postprocess(input: Output): Output
}
