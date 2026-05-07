package com.executorch.webrtc

import android.graphics.Matrix
import android.os.Handler
import android.util.Log
import com.executorch.webrtc.gl.GlBlurRenderer
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import org.webrtc.SurfaceTextureHelper
import org.webrtc.TextureBufferImpl
import org.webrtc.VideoFrame
import org.webrtc.YuvConverter
import java.nio.ByteBuffer

/**
 * WebRTC frame processor that applies background blur using GPU shaders +
 * ExecuTorch segmentation.
 *
 * Threading model
 * ---------------
 * One lock guards every mutable field. It is held for the entire process()
 * call and for the synchronous portion of setBlurRadius() and release(). The
 * WebRTC capturer delivers frames on a single thread per source, so this
 * lock essentially never contends with itself; cross-thread JS calls wait
 * at most one frame's processing time.
 *
 * GL teardown is the one operation that must run on a specific thread (the
 * one that owns the GL context), so release() posts that work to the
 * capturer's handler and returns immediately. Everything else is direct.
 */
class ExecutorchFrameProcessor : VideoFrameProcessor {
  companion object {
    private const val TAG = "ExecutorchFrameProcessor"
    private const val LOG_INTERVAL_FRAMES = 30
  }

  private val lock = Any()

  // All fields below are guarded by `lock`.
  private val renderer = GlBlurRenderer()
  private var modelHandle: Long = 0
  private var loadedModelPath: String? = null
  private var lastProcessedFrame: VideoFrame? = null
  private var yuvConverter: YuvConverter? = null
  private var rgbaBuffer: ByteArray? = null
  private var maskBuffer: ByteBuffer? = null
  private var glHandler: Handler? = null
  private var released = false

  // Stats — touched only inside process() under lock.
  private var frameCount = 0
  private var totalTimeAccumulator = 0L
  private var inferenceTimeAccumulator = 0L
  private var gpuTimeAccumulator = 0L

  init {
    Log.d(TAG, "ExecutorchFrameProcessor created")
  }

  // JNI: Load the segmentation model. Returns 0 on failure, otherwise an
  // opaque handle that owns the model and EMA state for this instance.
  private external fun loadModel(modelPath: String): Long

  // JNI: Run segmentation on RGBA pixels. Returns the mask as a byte array.
  private external fun runSegmentation(
    handle: Long,
    rgbaData: ByteArray,
    width: Int,
    height: Int,
    rotation: Int,
  ): ByteArray?

  // JNI: Drop the model and free the native handle. Caller must guarantee
  // no concurrent runSegmentation on the same handle (Kotlin's lock does).
  private external fun unloadModel(handle: Long)

  override fun process(
    frame: VideoFrame,
    helper: SurfaceTextureHelper,
  ): VideoFrame {
    synchronized(lock) {
      if (released) {
        frame.retain()
        return frame
      }
      glHandler = helper.handler

      val buffer = frame.buffer
      if (buffer !is VideoFrame.TextureBuffer) {
        frame.retain()
        return frame
      }

      return try {
        val result = processFrameLocked(frame, buffer, helper)
        lastProcessedFrame?.release()
        result.retain()
        lastProcessedFrame = result
        result
      } catch (e: Exception) {
        Log.e(TAG, "process failed", e)
        val cached = lastProcessedFrame
        if (cached != null) {
          cached.retain()
          cached
        } else {
          frame.retain()
          frame
        }
      }
    }
  }

  fun setBlurRadius(radius: Float) {
    synchronized(lock) {
      if (released) return
      renderer.setBlurRadius(radius)
    }
  }

  fun release() {
    val handler: Handler?
    val frameToDrop: VideoFrame?
    synchronized(lock) {
      if (released) return
      released = true
      if (modelHandle != 0L) {
        unloadModel(modelHandle)
        modelHandle = 0L
        loadedModelPath = null
      }
      frameToDrop = lastProcessedFrame
      lastProcessedFrame = null
      handler = glHandler
    }
    frameToDrop?.release()

    if (handler == null) {
      // Never received a frame, so no GL state to tear down.
      return
    }

    // GL teardown must run on the thread that owns the GL context.
    handler.post {
      synchronized(lock) {
        renderer.release()
        yuvConverter?.release()
        yuvConverter = null
        rgbaBuffer = null
        maskBuffer = null
      }
      Log.d(TAG, "ExecutorchFrameProcessor GL resources released")
    }
  }

  private fun processFrameLocked(
    frame: VideoFrame,
    textureBuffer: VideoFrame.TextureBuffer,
    helper: SurfaceTextureHelper,
  ): VideoFrame {
    val totalStartTime = System.nanoTime()

    val width = textureBuffer.width
    val height = textureBuffer.height

    renderer.ensureSetup(width, height)
    if (yuvConverter == null) {
      yuvConverter = YuvConverter()
    }

    val transformMatrix = convertToGlMatrix(textureBuffer.transformMatrix)
    val isOes = textureBuffer.type == VideoFrame.TextureBuffer.Type.OES

    val gpuStartTime = System.nanoTime()

    renderer.renderToRgbaFbo(textureBuffer.textureId, transformMatrix, isOes)
    renderer.renderDownscaled()

    val segPixels = renderer.readSegmentationPixels()
    val segW = renderer.segmentationWidth
    val segH = renderer.segmentationHeight

    val inferenceStartTime = System.nanoTime()
    val rawMask = runSegmentationLocked(segPixels, segW, segH, frame.rotation)
    val inferenceEndTime = System.nanoTime()

    if (rawMask != null) {
      if (maskBuffer == null || maskBuffer!!.capacity() < rawMask.size) {
        maskBuffer = ByteBuffer.allocateDirect(rawMask.size)
      }
      maskBuffer!!.clear()
      maskBuffer!!.put(rawMask)
      maskBuffer!!.rewind()
      renderer.uploadMask(maskBuffer, segW, segH)
    }

    renderer.renderBlur()
    renderer.renderComposite()

    val gpuEndTime = System.nanoTime()

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

    val totalEndTime = System.nanoTime()
    totalTimeAccumulator += (totalEndTime - totalStartTime)
    inferenceTimeAccumulator += (inferenceEndTime - inferenceStartTime)
    gpuTimeAccumulator += (gpuEndTime - gpuStartTime) - (inferenceEndTime - inferenceStartTime)
    frameCount++

    if (frameCount >= LOG_INTERVAL_FRAMES) {
      val avgTotalMs = (totalTimeAccumulator / frameCount) / 1_000_000.0
      val avgInferenceMs = (inferenceTimeAccumulator / frameCount) / 1_000_000.0
      val avgGpuMs = (gpuTimeAccumulator / frameCount) / 1_000_000.0
      val fps = 1000.0 / avgTotalMs
      Log.d(
        TAG,
        String.format(
          "Avg over %d frames: Total=%.2fms (%.1f FPS) | Inference=%.2fms | GPU=%.2fms",
          frameCount,
          avgTotalMs,
          fps,
          avgInferenceMs,
          avgGpuMs,
        ),
      )
      frameCount = 0
      totalTimeAccumulator = 0L
      inferenceTimeAccumulator = 0L
      gpuTimeAccumulator = 0L
    }

    return VideoFrame(outputBuffer, frame.rotation, frame.timestampNs)
  }

  private fun runSegmentationLocked(
    pixels: ByteBuffer,
    width: Int,
    height: Int,
    rotation: Int,
  ): ByteArray? {
    val handle = ensureHandleLocked()
    if (handle == null) {
      // No model configured yet — return a zero mask so the GPU pipeline
      // still produces an all-blurred frame.
      return ByteArray(width * height)
    }

    val size = width * height * 4
    if (rgbaBuffer == null || rgbaBuffer!!.size < size) {
      rgbaBuffer = ByteArray(size)
    }
    pixels.rewind()
    pixels.get(rgbaBuffer!!, 0, size)

    return runSegmentation(handle, rgbaBuffer!!, width, height, rotation)
  }

  private fun ensureHandleLocked(): Long? {
    val configuredPath = ExecutorchWebRTC.modelPath ?: return null
    if (modelHandle != 0L && loadedModelPath == configuredPath) {
      return modelHandle
    }
    if (modelHandle != 0L) {
      unloadModel(modelHandle)
      modelHandle = 0L
      loadedModelPath = null
    }
    return try {
      Log.d(TAG, "Loading segmentation model: $configuredPath")
      val handle = loadModel(configuredPath)
      if (handle != 0L) {
        modelHandle = handle
        loadedModelPath = configuredPath
        Log.d(TAG, "Model loaded successfully!")
        handle
      } else {
        null
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to load model", e)
      null
    }
  }

  private fun convertToGlMatrix(androidMatrix: android.graphics.Matrix): FloatArray {
    val values = FloatArray(9)
    androidMatrix.getValues(values)
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
}
