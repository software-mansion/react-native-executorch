package com.executorch.webrtc

import android.util.Log
import com.oney.WebRTCModule.videoEffects.ProcessorProvider

/**
 * Main entry point for ExecuTorch WebRTC integration.
 * Call registerProcessors() from your Application.onCreate()
 */
object ExecutorchWebRTC {
  private const val TAG = "ExecutorchWebRTC"
  const val PROCESSOR_NAME = "executorchBackgroundBlur"
  const val PROCESSOR_NAME_NEW = "executorchBackgroundBlurNew"

  // Configuration for background removal
  var modelPath: String? = null

  /**
   * Registers both frame processors with react-native-webrtc.
   * - "executorchBackgroundBlur" -> existing GL-based processor
   * - "executorchBackgroundBlurNew" -> new experimental processor
   */
  fun registerProcessors() {
    try {
      ProcessorProvider.addProcessor(PROCESSOR_NAME, ExecutorchFrameProcessorFactory())
      Log.d(TAG, "✅ Registered processor: $PROCESSOR_NAME")
    } catch (e: Exception) {
      Log.e(TAG, "❌ Failed to register $PROCESSOR_NAME", e)
    }

    try {
      ProcessorProvider.addProcessor(PROCESSOR_NAME_NEW, NewExecutorchFrameProcessorFactory())
      Log.d(TAG, "✅ Registered processor: $PROCESSOR_NAME_NEW")
    } catch (e: Exception) {
      Log.e(TAG, "❌ Failed to register $PROCESSOR_NAME_NEW", e)
    }
  }

  /**
   * Configure the segmentation model for background removal
   */
  fun configureModel(path: String) {
    Log.d(TAG, "📥 configureModel called with path: $path")
    modelPath = path
    Log.d(TAG, "✅ Model path configured - processors will load model on next frame")
  }

  /**
   * Gets the processor name to use in JavaScript.
   * Use this when calling videoTrack._setVideoEffects(['...'])
   */
  fun getProcessorName(): String = PROCESSOR_NAME
}
