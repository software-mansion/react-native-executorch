package com.swmansion.rnexecutorch

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RnExecutorchModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var implementation: RnExecutorchImpl = RnExecutorchImpl()

  override fun getName(): String = RnExecutorchImpl.NAME

  @ReactMethod
  fun multiply(a: Double, b: Double, promise: Promise) {
    implementation.multiply(a, b, promise)
  }
}