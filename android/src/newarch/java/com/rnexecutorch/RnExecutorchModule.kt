package com.swmansion.rnexecutorch

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.core.DeviceEventManagerModule

class RnExecutorchModule(reactContext: ReactApplicationContext) :
  NativeRnExecutorchSpec(reactContext) {
  private var implementation: RnExecutorchImpl = RnExecutorchImpl()
  private var listenerCount = 0
  private var eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? = null

  override fun getName(): String = RnExecutorchImpl.NAME

  override fun initialize() {
    super.initialize()
    eventEmitter =
      reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  }

  override fun addListener(eventName: String) {
    return
  }

  override fun removeListeners(count: Double) {
    return
  }

  override fun loadLLM(
    modelSource: String,
    tokenizerSource: String,
    systemPrompt: String,
    contextWindowLength: Double,
    promise: Promise
  ) {
        implementation.loadLLM(modelSource, tokenizerSource, systemPrompt, contextWindowLength.toInt(), reactApplicationContext, eventEmitter, promise)
  }

  override fun runInference(input: String, promise: Promise){
    implementation.runInference(input, promise)
  }

  override fun interrupt() {
    implementation.interrupt()
  }

  override fun deleteModule() {
    implementation.deleteModule()
  }
}
