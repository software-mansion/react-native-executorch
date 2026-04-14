package com.executorch.webrtc

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native module that auto-registers the frame processor when loaded.
 * This allows the package to work without manual native code setup.
 */
@ReactModule(name = ExecutorchWebRTCModule.NAME)
class ExecutorchWebRTCModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    init {
      System.loadLibrary("executorch")
      System.loadLibrary("react-native-executorch-webrtc")

    }
    const val NAME = "ExecutorchWebRTC"
    private var initialized = false
    private var moduleContext: ReactApplicationContext? = null


    /**
     * Send event to JavaScript
     */
    fun sendEvent(
      eventName: String,
      params: WritableMap?,
    ) {
      moduleContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(eventName, params)
    }
  }

  init {
    moduleContext = reactContext

    // Auto-register the processor when the module is loaded
    if (!initialized) {
      ExecutorchWebRTC.registerProcessors()
      initialized = true
    }
  }

  override fun getName(): String = NAME

  /**
   * No-op method just to ensure the module is loaded.
   * Called from JS to trigger initialization.
   */
  @ReactMethod
  fun setup() {
    // Module init happens in constructor, this is just a trigger
  }

  /**
   * Configure the segmentation model for background removal
   * @param modelPath Path to the .pte model file
   */
  @ReactMethod
  fun configureBackgroundRemoval(modelPath: String) {
    ExecutorchWebRTC.configureModel(modelPath)
  }

  // Legacy alias
  @ReactMethod
  fun configureBackgroundBlur(
    modelPath: String,
    blurIntensity: Int,
  ) {
    ExecutorchWebRTC.configureModel(modelPath)
  }

  /**
   * Get available processor names for use with videoTrack._setVideoEffects()
   */
  override fun getConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      "PROCESSOR_NAME" to ExecutorchWebRTC.PROCESSOR_NAME,
      "PROCESSOR_NAME_NEW" to ExecutorchWebRTC.PROCESSOR_NAME_NEW
    )
  }
}
