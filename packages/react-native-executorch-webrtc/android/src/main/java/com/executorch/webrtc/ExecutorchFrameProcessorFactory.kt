package com.executorch.webrtc

import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface

/**
 * Factory for creating ExecutorchFrameProcessor instances.
 * Required by react-native-webrtc's ProcessorProvider system.
 */
class ExecutorchFrameProcessorFactory : VideoFrameProcessorFactoryInterface {
    override fun build(): VideoFrameProcessor {
        return ExecutorchFrameProcessor()
    }
}
