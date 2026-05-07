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

  // Read on the capture thread (in ExecutorchFrameProcessor.ensureHandleLocked),
  // written on the JS thread. @Volatile makes the write visible.
  @Volatile
  var modelPath: String? = null

  // Live processor instances. setBlurRadius / deinitialize forward to them.
  private val processors = mutableSetOf<ExecutorchFrameProcessor>()

  fun registerProcessor(p: ExecutorchFrameProcessor) {
    synchronized(processors) { processors.add(p) }
  }

  fun unregisterProcessor(p: ExecutorchFrameProcessor) {
    synchronized(processors) { processors.remove(p) }
  }

  fun registerProcessors() {
    try {
      ProcessorProvider.addProcessor(PROCESSOR_NAME, ExecutorchFrameProcessorFactory())
      Log.d(TAG, "Registered processor: $PROCESSOR_NAME")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to register $PROCESSOR_NAME", e)
    }
  }

  fun configureModel(path: String) {
    Log.d(TAG, "configureModel called with path: $path")
    modelPath = path
  }

  fun setBlurRadius(radius: Float) {
    val snapshot = synchronized(processors) { processors.toList() }
    snapshot.forEach { it.setBlurRadius(radius) }
  }

  fun deinitialize() {
    Log.d(TAG, "Deinitializing ExecutorchWebRTC")
    modelPath = null
    val toRelease =
      synchronized(processors) {
        val copy = processors.toList()
        processors.clear()
        copy
      }
    toRelease.forEach { it.release() }
    Log.d(TAG, "ExecutorchWebRTC deinitialized")
  }

  fun getProcessorName(): String = PROCESSOR_NAME
}
