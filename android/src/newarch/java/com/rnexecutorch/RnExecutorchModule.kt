package com.swmansion.rnexecutorch

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

class RnExecutorchModule(reactContext: ReactApplicationContext) : NativeRnExecutorchSpec(reactContext) {
  private var implementation: RnExecutorchImpl = RnExecutorchImpl()

  override fun getName(): String = RnExecutorchImpl.NAME

  override fun multiply(a: Double, b: Double, promise: Promise) {
    implementation.multiply(a, b, promise)
  }
}