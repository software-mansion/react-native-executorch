package com.executorch.webrtc

import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface

/**
 * Factory for creating ExecutorchFrameProcessor instances.
 * Required by react-native-webrtc's ProcessorProvider system.
 */
class ExecutorchFrameProcessorFactory : VideoFrameProcessorFactoryInterface {
  companion object {
    private val activeProcessors = mutableListOf<ExecutorchFrameProcessor>()

    /**
     * Release all active processors and clear the list
     */
    @JvmStatic
    fun releaseAll() {
      synchronized(activeProcessors) {
        activeProcessors.forEach { it.release() }
        activeProcessors.clear()
      }
    }
  }

  override fun build(): VideoFrameProcessor {
    val processor = ExecutorchFrameProcessor()
    synchronized(activeProcessors) {
      activeProcessors.add(processor)
    }
    return processor
  }
}
