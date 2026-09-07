package com.swmansion.rnexecutorch

import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.ReactApplicationContext

class RnExecutorchModule(reactContext: ReactApplicationContext) : RnExecutorchSpec(reactContext) {

  override fun getName(): String = NAME

  override fun install(): Boolean {
    val contextHolder: JavaScriptContextHolder =
      reactApplicationContext.javaScriptContextHolder ?: return false
    nativeInstall(contextHolder.get())
    return true
  }

  companion object {
    const val NAME = "RnExecutorch"

    init {
      System.loadLibrary("executorch")
      System.loadLibrary("RnExecutorch")
    }

    @JvmStatic
    external fun nativeInstall(jsi: Long)
  }
}
