package com.swmansion.rnexecutorch.models

import android.content.Context
import com.swmansion.rnexecutorch.utils.ETError
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module
import java.net.URL


abstract class BaseModel<Input, Output>(val context: Context) {
  protected lateinit var module: Module

  fun loadModel(modelSource: String) {
    module = Module.load(URL(modelSource).path)
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

  protected abstract fun preprocess(input: Input): EValue

  protected abstract fun postprocess(output: Array<EValue>): Output
}
