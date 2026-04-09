package com.executorch.webrtc

import android.util.Log
import com.oney.WebRTCModule.videoEffects.ProcessorProvider

/**
 * Main entry point for ExecuTorch WebRTC integration.
 * Call registerProcessors() from your Application.onCreate()
 */
object ExecutorchWebRTC {
    private const val TAG = "ExecutorchWebRTC"
    private const val PROCESSOR_NAME = "executorch"

    // Configuration for background removal
    var modelPath: String? = null

    /**
     * Registers the ExecuTorch frame processor with react-native-webrtc.
     * Call this in your Application.onCreate() method.
     */
    fun registerProcessors() {
        try {
            ProcessorProvider.addProcessor(PROCESSOR_NAME, ExecutorchFrameProcessorFactory())
            Log.d(TAG, "✅ ExecuTorch frame processor registered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to register ExecuTorch processor", e)
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
