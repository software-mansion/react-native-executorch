package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.TensorUtils
import org.pytorch.executorch.EValue
import org.pytorch.executorch.Module
import java.net.URL

class ETModule(reactContext: ReactApplicationContext) : NativeETModuleSpec(reactContext) {
  private lateinit var module: Module
  private var reactApplicationContext = reactContext;
  override fun getName(): String {
    return NAME
  }

  override fun loadModule(modelSource: String, promise: Promise) {
    module = Module.load(URL(modelSource).path)
    promise.resolve(0)
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
    inputs: ReadableArray,
    shapes: ReadableArray,
    inputTypes: ReadableArray,
    promise: Promise
  ) {
    val inputEValues = ArrayList<EValue>()
    try {
      for (i in 0 until inputs.size()) {
        val currentInput = inputs.getArray(i)
          ?: throw Exception(ETError.InvalidArgument.code.toString())
        val currentShape = shapes.getArray(i)
          ?: throw Exception(ETError.InvalidArgument.code.toString())
        val currentInputType = inputTypes.getInt(i)

        val currentEValue = TensorUtils.getExecutorchInput(
          currentInput,
          ArrayUtils.createLongArray(currentShape),
          currentInputType
        )

        inputEValues.add(currentEValue)
      }

      val forwardOutputs = module.forward(*inputEValues.toTypedArray());
      val outputArray = Arguments.createArray()

      for (output in forwardOutputs) {
        val arr = ArrayUtils.createReadableArrayFromTensor(output.toTensor())
        outputArray.pushArray(arr)
      }
      promise.resolve(outputArray)

    } catch (e: IllegalArgumentException) {
      // The error is thrown when transformation to Tensor fails
      promise.reject("Forward Failed Execution", ETError.InvalidArgument.code.toString())
      return
    } catch (e: Exception) {
      promise.reject("Forward Failed Execution", e.message!!)
      return
    }
  }

  companion object {
    const val NAME = "ETModule"
  }
}
