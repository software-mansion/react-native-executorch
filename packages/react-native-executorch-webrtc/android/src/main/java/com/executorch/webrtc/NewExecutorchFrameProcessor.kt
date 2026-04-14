package com.executorch.webrtc

import android.util.Log
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoFrame
import org.webrtc.YuvConverter

class NewExecutorchFrameProcessor : VideoFrameProcessor{
  private val TAG = "ExecuTorchBlurFrameProcessor"
  private val lastFrame: VideoFrame? = null
  private val yuvConverter = YuvConverter()
  private var isModelLoaded = false
  private lateinit var blurRadius: Number;

  // JNI: Load the segmentation model
//private external fun loadModel(modelPath: String): Boolean

  fun setBlurRadius(blurRadius: Number) {this.blurRadius = blurRadius}

  fun tryLoadModel(modelPath: String) {
    // TODO: maybe we should throw here
    if (isModelLoaded) return
    try {
      Log.d(TAG, "Loading selfie segmentation model with model path: $modelPath")
 //     val success = loadModel(modelPath)
      val success = true;
      if (success) {
        this.isModelLoaded = true
        Log.d(TAG, "Successfully loaded selfie segmentation model")
      } else {
        this.isModelLoaded = false
        Log.e(TAG, "Failed to load selfie segmentation model with model path: $modelPath")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to load model", e)
    }
  }

  private fun internalProcessFrame(
    frame: VideoFrame.Buffer
  ){

  }

  override fun process(
    frame: VideoFrame,
    textureHelper: SurfaceTextureHelper
  ): VideoFrame {
    if (!this.isModelLoaded) {
      Log.d(TAG, "The model was not initialized properly," +
        " make sure to run tryLoadModel() before using the frame processor.")
      frame.retain()
      return frame;
    }

    val buf = frame.buffer
    val outputFrame = this.internalProcessFrame(buf)

    frame.retain()
   return frame
  }
}
