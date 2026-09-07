package com.swmansion.rnexecutorch

import com.facebook.react.bridge.ReactApplicationContext

abstract class RnExecutorchSpec(reactContext: ReactApplicationContext) : NativeRnExecutorchSpec(reactContext) {
  abstract override fun getName(): String
}
