package com.swmansion.rnexecutorch.models

import android.content.Context
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.Fetcher
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module
import org.pytorch.executorch.Tensor


abstract class BaseModel<Input, Output>(val context: Context) {
  protected lateinit var module: Module

  fun loadModel(modelSource: String) {
    Fetcher.downloadModel(
      context,
      modelSource
    ) { path, error ->
      if (error != null) {
        throw Error(error.message!!)
      }

      module = Module.load(path)
    }
  }

  protected fun forward(input: EValue): Array<EValue> {
    try {
      val result = module.forward(input)
      return result
    } catch (e: IllegalArgumentException) {
      //The error is thrown when transformation to Tensor fails
      throw Error(ETError.InvalidArgument.code.toString())
    } catch (e: Exception) {
      throw Error(e.message!!)
    }
  }

  abstract fun runModel(input: Input): Output

  protected abstract fun preprocess(input: Input): Input

  protected abstract fun postprocess(input: Tensor): Output
}
