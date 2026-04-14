package com.executorch.webrtc

import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface

class NewExecutorchFrameProcessorFactory : VideoFrameProcessorFactoryInterface {
  override fun build(): VideoFrameProcessor = NewExecutorchFrameProcessor()
}
