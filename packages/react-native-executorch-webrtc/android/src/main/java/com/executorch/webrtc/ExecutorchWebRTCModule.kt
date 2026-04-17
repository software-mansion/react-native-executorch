package com.executorch.webrtc

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

/**
 * Native module for ExecuTorch WebRTC background blur.
 * API compatible with @fishjam-cloud/react-native-webrtc-background-blur.
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
    private var processorsRegistered = false
  }

  init {
    // Auto-register the processor when the module is loaded
    if (!processorsRegistered) {
      ExecutorchWebRTC.registerProcessors()
      processorsRegistered = true
    }
  }

  override fun getName(): String = NAME

  /**
   * Initialize background blur with the segmentation model.
   * @param modelPath Path to the .pte model file
   */
  @ReactMethod
  fun initialize(modelPath: String) {
    ExecutorchWebRTC.configureModel(modelPath)
  }

  /**
   * Deinitialize and release resources.
   */
  @ReactMethod
  fun deinitialize() {
    // Currently no-op, resources are managed per-frame
    // Could be extended to unload the model if needed
  }

  /**
   * Set the blur radius/intensity.
   * @param radius Blur sigma value (default 12.0)
   */
  @ReactMethod
  fun setBlurRadius(radius: Double) {
    ExecutorchWebRTC.setBlurRadius(radius.toFloat())
  }

  /**
   * Check if background blur is available on this device.
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isAvailable(): Boolean {
    return true // Always available on Android with ExecuTorch
  }

  /**
   * Get the processor name for use with _setVideoEffect().
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getProcessorName(): String = ExecutorchWebRTC.PROCESSOR_NAME
}
