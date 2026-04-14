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
import java.nio.ByteOrder

/**
 * WebRTC frame processor that applies background blur using GPU shaders + ExecuTorch segmentation.
 * Uses OpenGL for blur (fast) and JNI for segmentation.
 */
class ExecutorchFrameProcessor : VideoFrameProcessor {
  private var frameCount = 0
  private var lastLogTime = System.currentTimeMillis()
  private val TAG = "ExecutorchFrameProcessor"

  private var modelLoaded = false
  private var loadedModelPath: String? = null

  // GL-based blur renderer
  private var renderer: GlBlurRenderer? = null
  private var yuvConverter: YuvConverter? = null

  // Reusable buffers
  private var maskByteBuffer: ByteBuffer? = null
  private var rgbaBuffer: ByteArray? = null

  init {
    Log.d(TAG, "ExecutorchFrameProcessor created - GL blur pipeline")
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
    rotation: Int
  ): ByteArray?

  override fun process(frame: VideoFrame, helper: SurfaceTextureHelper): VideoFrame {
    frameCount++
    if (!modelLoaded) tryLoadModel()

    // Log stats every second
    val now = System.currentTimeMillis()
    if (now - lastLogTime >= 1000) {
      Log.d(TAG, "FPS: ${frameCount}, buffer: ${frame.buffer.javaClass.simpleName}")
      lastLogTime = now
      frameCount = 0
    }

    val buffer = frame.buffer
    if (buffer !is VideoFrame.TextureBuffer) {
      // Not a texture buffer, return original
      frame.retain()
      return frame
    }

    return try {
      processWithGl(frame, buffer, helper)
    } catch (e: Exception) {
      Log.e(TAG, "GL processing failed: ${e.message}")
      frame.retain()
      frame
    }
  }

  private fun processWithGl(
    frame: VideoFrame,
    textureBuffer: VideoFrame.TextureBuffer,
    helper: SurfaceTextureHelper
  ): VideoFrame {
    val width = textureBuffer.width
    val height = textureBuffer.height

    // Initialize renderer if needed
    if (renderer == null) {
      renderer = GlBlurRenderer()
    }
    renderer!!.ensureSetup(width, height)

    if (yuvConverter == null) {
      yuvConverter = YuvConverter()
    }

    // Convert transform matrix for GL
    val transformMatrix = convertToGlMatrix(textureBuffer.transformMatrix)
    val isOes = textureBuffer.type == VideoFrame.TextureBuffer.Type.OES

    // 1. Render input texture to RGBA FBO
    renderer!!.renderToRgbaFbo(textureBuffer.textureId, transformMatrix, isOes)

    // 2. Render downscaled for segmentation
    renderer!!.renderDownscaled()

    // 3. Read pixels for segmentation
    val segPixels = renderer!!.readSegmentationPixels()
    val segW = renderer!!.segmentationWidth
    val segH = renderer!!.segmentationHeight

    // 4. Run segmentation (via JNI)
    val mask = runSegmentationOnPixels(segPixels, segW, segH, frame.rotation)

    // 5. Upload mask to GPU
    if (mask != null) {
      ensureMaskBuffer(mask.size)
      maskByteBuffer!!.clear()
      maskByteBuffer!!.put(mask)
      maskByteBuffer!!.rewind()
      renderer!!.uploadMask(maskByteBuffer!!, segW, segH)
    }

    // 6. Render blur (two-pass Gaussian)
    renderer!!.renderBlur()

    // 7. Render composite (blend original + blurred using mask)
    renderer!!.renderComposite()

    // 8. Create output TextureBuffer
    val outputBuffer = TextureBufferImpl(
      width, height,
      VideoFrame.TextureBuffer.Type.RGB,
      renderer!!.outputTextureId,
      Matrix(),
      helper.handler,
      yuvConverter,
      null
    )

    return VideoFrame(outputBuffer, frame.rotation, frame.timestampNs)
  }

  private fun runSegmentationOnPixels(pixels: ByteBuffer, width: Int, height: Int, rotation: Int): ByteArray? {
    if (!modelLoaded) {
      // Return placeholder ellipse mask if model not loaded
      return createEllipseMask(width, height)
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

  private fun createEllipseMask(width: Int, height: Int): ByteArray {
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
        val value = when {
          dist < 1.0f -> 255
          dist < 1.3f -> ((1.0f - (dist - 1.0f) / 0.3f) * 255).toInt()
          else -> 0
        }
        mask[y * width + x] = value.toByte()
      }
    }
    return mask
  }

  private fun ensureMaskBuffer(size: Int) {
    if (maskByteBuffer == null || maskByteBuffer!!.capacity() < size) {
      maskByteBuffer = ByteBuffer.allocateDirect(size).order(ByteOrder.nativeOrder())
    }
  }

  private fun convertToGlMatrix(androidMatrix: android.graphics.Matrix): FloatArray {
    val values = FloatArray(9)
    androidMatrix.getValues(values)
    // Convert 3x3 to 4x4 matrix for GL
    return floatArrayOf(
      values[0], values[3], 0f, values[6],
      values[1], values[4], 0f, values[7],
      0f, 0f, 1f, 0f,
      values[2], values[5], 0f, values[8]
    )
  }

  fun release() {
    renderer?.release()
    renderer = null
    yuvConverter?.release()
    yuvConverter = null
  }
}
