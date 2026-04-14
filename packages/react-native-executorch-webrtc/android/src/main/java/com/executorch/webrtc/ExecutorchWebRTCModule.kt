package com.executorch.webrtc

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

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
  }

  init {
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

  /**
   * Configure the segmentation model and blur intensity
   * @param modelPath Path to the .pte model file
   * @param blurIntensity Blur sigma value (default 12.0)
   */
  @ReactMethod
  fun configureBackgroundBlur(
    modelPath: String,
    blurIntensity: Int,
  ) {
    ExecutorchWebRTC.configureModel(modelPath)
    ExecutorchWebRTC.setBlurRadius(blurIntensity.toFloat())
  }

  /**
   * Set the blur radius dynamically
   * @param radius Blur sigma value
   */
  @ReactMethod
  fun setBlurRadius(radius: Double) {
    ExecutorchWebRTC.setBlurRadius(radius.toFloat())
  }

  /**
   * Get available processor names for use with videoTrack._setVideoEffects()
   */
  override fun getConstants(): MutableMap<String, Any> =
    mutableMapOf(
      "PROCESSOR_NAME" to ExecutorchWebRTC.PROCESSOR_NAME,
    )
}
