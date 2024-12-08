package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.swmansion.rnexecutorch.utils.ArrayUtils
import com.swmansion.rnexecutorch.utils.ETError
import com.swmansion.rnexecutorch.utils.Fetcher
import com.swmansion.rnexecutorch.utils.TensorUtils
import org.pytorch.executorch.Module

class ETModule(reactContext: ReactApplicationContext) : NativeETModuleSpec(reactContext) {
  private lateinit var module: Module

  override fun getName(): String {
    return NAME
  }

  override fun loadModule(modelPath: String, promise: Promise) {
    Fetcher.downloadModel(
      reactApplicationContext,
      modelPath,
    ) { path, error ->
      if (error != null) {
        promise.reject(error.message!!, ETError.InvalidModelPath.toString())
        return@downloadModel
      }

      module = Module.load(path)
      promise.resolve(0)
      return@downloadModel
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

      val result = module.forward(executorchInput)
      val resultArray = Arguments.createArray()

      for (evalue in result) {
        resultArray.pushArray(ArrayUtils.createReadableArray(evalue.toTensor()))
      }

      promise.resolve(resultArray)
      return
    } catch (e: IllegalArgumentException) {
      //The error is thrown when transformation to Tensor fails
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
