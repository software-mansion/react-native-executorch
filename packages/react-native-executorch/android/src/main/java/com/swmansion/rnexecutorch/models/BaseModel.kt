package com.swmansion.rnexecutorch.models

import android.content.Context
import com.swmansion.rnexecutorch.utils.ETError
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module
import org.pytorch.executorch.Tensor

abstract class BaseModel<Input, Output>(
  val context: Context,
) {
  protected lateinit var module: Module

  fun loadModel(modelSource: String) {
    module = Module.load(modelSource)
  }

  protected fun forward(vararg inputs: EValue): Array<EValue> {
    try {
      val result = module.forward(*inputs)
      return result
    } catch (e: IllegalArgumentException) {
      // The error is thrown when transformation to Tensor fails
      throw Error(ETError.InvalidArgument.code.toString())
    } catch (e: Exception) {
      throw Error(e.message)
    }
  }

  protected fun forward(
    inputs: Array<FloatArray>,
    shapes: Array<LongArray>,
  ): Array<EValue> = this.execute("forward", inputs, shapes)

  protected fun execute(
    methodName: String,
    inputs: Array<FloatArray>,
    shapes: Array<LongArray>,
  ): Array<EValue> {
    // We want to convert each input to EValue, a data structure accepted by ExecuTorch's
    // Module. The array below keeps track of that values.
    try {
      val executorchInputs = inputs.mapIndexed { index, _ -> EValue.from(Tensor.fromBlob(inputs[index], shapes[index])) }
      val forwardResult = module.execute(methodName, *executorchInputs.toTypedArray())
      return forwardResult
    } catch (e: IllegalArgumentException) {
      throw Error(ETError.InvalidArgument.code.toString())
    } catch (e: Exception) {
      throw Error(e.message)
    }
  }

  abstract fun runModel(input: Input): Output
}
