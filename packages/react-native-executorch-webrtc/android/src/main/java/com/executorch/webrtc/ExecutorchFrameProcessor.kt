package com.executorch.webrtc

import android.graphics.Matrix
import android.util.Log
import com.executorch.webrtc.gl.GlBlurRenderer
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import org.webrtc.SurfaceTextureHelper
import org.webrtc.TextureBufferImpl
import org.webrtc.VideoFrame
import org.webrtc.YuvConverter
import java.nio.ByteBuffer

/**
 * WebRTC frame processor that applies background blur using GPU shaders + ExecuTorch segmentation.
 * Uses MaskPostProcessor for temporal smoothing (EMA) and edge refinement.
 *
 * Architecture matches fishjam's BackgroundBlurProcessor but uses ExecuTorch for mask generation
 * instead of ML Kit.
 */
class ExecutorchFrameProcessor : VideoFrameProcessor {
  companion object {
    private const val TAG = "ExecutorchFrameProcessor"
    private const val LOG_INTERVAL_FRAMES = 30

    @Volatile
    private var pendingBlurRadius: Float = -1f

    @JvmStatic
    fun setBlurRadius(radius: Float) {
      pendingBlurRadius = radius
    }
  }

  private val renderer = GlBlurRenderer()
  private val maskPostProcessor = MaskPostProcessor()

  @Volatile
  private var isProcessing = false
  private var lastProcessedFrame: VideoFrame? = null
  private var yuvConverter: YuvConverter? = null

  private var modelLoaded = false
  private var loadedModelPath: String? = null
  private var rgbaBuffer: ByteArray? = null

  // Timing measurements
  private var frameCount = 0
  private var totalTimeAccumulator = 0L
  private var inferenceTimeAccumulator = 0L
  private var maskPostProcessTimeAccumulator = 0L
  private var gpuTimeAccumulator = 0L

  init {
    Log.d(TAG, "ExecutorchFrameProcessor created")
    tryLoadModel()
  }

  private fun tryLoadModel() {
    val configuredPath = ExecutorchWebRTC.modelPath ?: return
    if (modelLoaded && loadedModelPath == configuredPath) return

    try {
      Log.d(TAG, "Loading segmentation model: $configuredPath")
      val success = loadModel(configuredPath)
      if (success) {
        modelLoaded = true
        loadedModelPath = configuredPath
        Log.d(TAG, "Model loaded successfully!")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to load model", e)
    }
  }

  // JNI: Load the segmentation model
  private external fun loadModel(modelPath: String): Boolean

  // JNI: Run segmentation on RGBA pixels, returns grayscale mask
  private external fun runSegmentation(
    rgbaData: ByteArray,
    width: Int,
    height: Int,
    rotation: Int,
  ): ByteArray?

  override fun process(
    frame: VideoFrame,
    helper: SurfaceTextureHelper,
  ): VideoFrame {
    // Return cached frame if busy
    if (isProcessing) {
      if (lastProcessedFrame != null) {
        lastProcessedFrame!!.retain()
        return lastProcessedFrame!!
      }
      frame.retain()
      return frame
    }

    val buffer = frame.buffer
    if (buffer !is VideoFrame.TextureBuffer) {
      frame.retain()
      return frame
    }

    isProcessing = true
    return try {
      val result = processFrame(frame, buffer, helper)
      // Cache processed frame
      lastProcessedFrame?.release()
      result.retain()
      lastProcessedFrame = result
      result
    } catch (e: Exception) {
      Log.e(TAG, "Error processing frame", e)
      frame.retain()
      frame
    } finally {
      isProcessing = false
    }
  }

  private fun processFrame(
    frame: VideoFrame,
    textureBuffer: VideoFrame.TextureBuffer,
    helper: SurfaceTextureHelper,
  ): VideoFrame {
    applyPendingBlurRadius()
    if (!modelLoaded) tryLoadModel()

    val width = textureBuffer.width
    val height = textureBuffer.height

    renderer.ensureSetup(width, height)
    if (yuvConverter == null) {
      yuvConverter = YuvConverter()
    }

    // Convert transform matrix for GL
    val transformMatrix = convertToGlMatrix(textureBuffer.transformMatrix)
    val isOes = textureBuffer.type == VideoFrame.TextureBuffer.Type.OES

    // 1. Render input texture to RGBA FBO
    renderer.renderToRgbaFbo(textureBuffer.textureId, transformMatrix, isOes)

    // 2. Render downscaled for segmentation
    renderer.renderDownscaled()

    // 3. Read pixels for segmentation
    val segPixels = renderer.readSegmentationPixels()
    val segW = renderer.segmentationWidth
    val segH = renderer.segmentationHeight

    // 4. Run segmentation (via JNI)
    val rawMask = runSegmentationOnPixels(segPixels, segW, segH, frame.rotation)

    if (rawMask != null) {
      // 5. Post-process mask (morphology + EMA + Gaussian blur)
      val maskPostProcessStartTime = System.nanoTime()
      val processedMask = maskPostProcessor.process(rawMask, segW, segH)
      val maskPostProcessEndTime = System.nanoTime()
      maskPostProcessTimeAccumulator += (maskPostProcessEndTime - maskPostProcessStartTime)

      // 6. Upload processed mask to GPU
      renderer.uploadMask(processedMask, segW, segH)
    }

    // 7. Render blur
    renderer.renderBlur()

    // 8. Render composite (blend original + blurred using mask)
    renderer.renderComposite()

    // 9. Create output TextureBuffer
    val outputBuffer =
      TextureBufferImpl(
        width,
        height,
        VideoFrame.TextureBuffer.Type.RGB,
        renderer.outputTextureId,
        Matrix(),
        helper.handler,
        yuvConverter,
        null,
      )

    frameCount++

    return VideoFrame(outputBuffer, frame.rotation, frame.timestampNs)
  }

  private fun applyPendingBlurRadius() {
    val radius = pendingBlurRadius
    if (radius < 0f) return
    pendingBlurRadius = -1f
    renderer.setBlurRadius(radius)
  }

  private fun runSegmentationOnPixels(
    pixels: ByteBuffer,
    width: Int,
    height: Int,
    rotation: Int,
  ): ByteArray? {
    if (!modelLoaded) {
      val result = ByteArray(width * height)
      result.fill(0)
      return result
    }

    // Convert ByteBuffer to ByteArray for JNI
    val size = width * height * 4
    if (rgbaBuffer == null || rgbaBuffer!!.size < size) {
      rgbaBuffer = ByteArray(size)
    }
    pixels.rewind()
    pixels.get(rgbaBuffer!!, 0, size)

    return runSegmentation(rgbaBuffer!!, width, height, rotation)
  }

  private fun createEllipseMask(
    width: Int,
    height: Int,
  ): ByteArray {
    val mask = ByteArray(width * height)
    val centerX = width / 2f
    val centerY = height / 2f
    val radiusX = width * 0.4f
    val radiusY = height * 0.45f

    for (y in 0 until height) {
      for (x in 0 until width) {
        val dx = (x - centerX) / radiusX
        val dy = (y - centerY) / radiusY
        val dist = dx * dx + dy * dy
        val value =
          when {
            dist < 1.0f -> 255
            dist < 1.3f -> ((1.0f - (dist - 1.0f) / 0.3f) * 255).toInt()
            else -> 0
          }
        mask[y * width + x] = value.toByte()
      }
    }
    return mask
  }

  private fun convertToGlMatrix(androidMatrix: android.graphics.Matrix): FloatArray {
    val values = FloatArray(9)
    androidMatrix.getValues(values)
    // Convert 3x3 to 4x4 matrix for GL
    return floatArrayOf(
      values[0],
      values[3],
      0f,
      values[6],
      values[1],
      values[4],
      0f,
      values[7],
      0f,
      0f,
      1f,
      0f,
      values[2],
      values[5],
      0f,
      values[8],
    )
  }

  fun release() {
    renderer.release()
    yuvConverter?.release()
    yuvConverter = null
    lastProcessedFrame?.release()
    lastProcessedFrame = null
  }
}
