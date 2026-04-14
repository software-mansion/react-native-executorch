package com.executorch.webrtc

import android.util.Log
import com.oney.WebRTCModule.videoEffects.ProcessorProvider

/**
 * Main entry point for ExecuTorch WebRTC integration.
 * Registers the background blur processor with react-native-webrtc.
 */
object ExecutorchWebRTC {
  private const val TAG = "ExecutorchWebRTC"
  const val PROCESSOR_NAME = "executorchBackgroundBlur"

  // Configuration for background removal
  var modelPath: String? = null

  /**
   * Registers the frame processor with react-native-webrtc.
   */
  fun registerProcessors() {
    try {
      ProcessorProvider.addProcessor(PROCESSOR_NAME, ExecutorchFrameProcessorFactory())
      Log.d(TAG, "Registered processor: $PROCESSOR_NAME")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to register $PROCESSOR_NAME", e)
    }
  }

  /**
   * Configure the segmentation model for background removal
   */
  fun configureModel(path: String) {
    Log.d(TAG, "configureModel called with path: $path")
    modelPath = path
    Log.d(TAG, "Model path configured - processor will load model on next frame")
  }

  /**
   * Set the blur radius dynamically
   */
  fun setBlurRadius(radius: Float) {
    ExecutorchFrameProcessor.setBlurRadius(radius)
  }

  /**
   * Gets the processor name to use in JavaScript.
   * Use this when calling videoTrack._setVideoEffects(['...'])
   */
  fun getProcessorName(): String = PROCESSOR_NAME
}
