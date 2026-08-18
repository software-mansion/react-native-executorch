package com.swmansion.rnexecutorch

import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class RnExecutorchModule(reactContext: ReactApplicationContext) : RnExecutorchSpec(reactContext) {

  override fun getName(): String = NAME

  override fun install(): Boolean {
    val contextHolder: JavaScriptContextHolder =
      reactApplicationContext.javaScriptContextHolder ?: return false
    nativeInstall(contextHolder.get())
    return true
  }

  // Downloads on Android run through the system DownloadManager, which already
  // keeps going while the app is backgrounded or killed. These exist only
  // because the codegen spec is shared with iOS, where an in-process transfer
  // dies with the app and a background session is needed instead.
  override fun startDownload(taskId: String, url: String, destination: String, promise: Promise) {
    promise.reject(UNSUPPORTED, "startDownload is iOS-only; Android uses DownloadManager.")
  }

  override fun cancelDownload(taskId: String, promise: Promise) {
    promise.reject(UNSUPPORTED, "cancelDownload is iOS-only; Android uses DownloadManager.")
  }

  override fun resetDownload(destination: String, promise: Promise) {
    promise.reject(UNSUPPORTED, "resetDownload is iOS-only; Android uses DownloadManager.")
  }

  companion object {
    const val NAME = "RnExecutorch"
    private const val UNSUPPORTED = "UNSUPPORTED"

    init {
      System.loadLibrary("executorch")
      System.loadLibrary("RnExecutorch")
    }

    @JvmStatic
    external fun nativeInstall(jsi: Long)
  }
}
