package com.swmansion.rnexecutorch

import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import androidx.annotation.RequiresApi
import com.facebook.react.modules.core.DeviceEventManagerModule

class RnExecutorchModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var implementation: RnExecutorchImpl = RnExecutorchImpl()
  private var eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? = null

  override fun getName(): String = RnExecutorchImpl.NAME

  override fun initialize() {
    super.initialize()
    eventEmitter =
      reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  }

  @ReactMethod
  fun addListener(eventName: String) {
    return
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    return
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  @ReactMethod
  fun loadLLM(
    modelSource: String,
    tokenizerSource: String,
    systemPrompt: String,
    contextWindowLength: Int,
    promise: Promise
  ) {
    implementation.loadLLM(modelSource, tokenizerSource, systemPrompt, contextWindowLength, reactApplicationContext, eventEmitter, promise)
  }

  @RequiresApi(Build.VERSION_CODES.N)
  @ReactMethod
  fun runInference(input: String, promise: Promise){
    implementation.runInference(input, promise)
  }

  @ReactMethod
  fun interrupt() {
    implementation.interrupt()
  }

  @ReactMethod
  fun deleteModule() {
    implementation.deleteModule()
  }
}
