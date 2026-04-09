package com.executorch.webrtc

import android.util.Log
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoFrame
import org.webrtc.VideoFrame.I420Buffer
import java.nio.ByteBuffer

/**
 * WebRTC frame processor that applies background blur using ExecuTorch segmentation.
 */
class ExecutorchFrameProcessor : VideoFrameProcessor {
    private var frameCount = 0
    private var lastLogTime = System.currentTimeMillis()
    private var lastProcessTime = System.currentTimeMillis()
    private val TAG = "ExecutorchFrameProcessor"

    // Model state
    private var modelLoaded = false
    private var loadedModelPath: String? = null

    init {
        Log.d(TAG, "ExecutorchFrameProcessor created - background removal enabled")
        tryLoadModel()
    }

    /**
     * Try to load the model if not already loaded and path is available.
     * Called from init and on each frame to handle late model configuration.
     */
    private fun tryLoadModel() {
        val configuredPath = ExecutorchWebRTC.modelPath

        // Skip if no path configured or already loaded this path
        if (configuredPath == null) {
            return
        }

        if (modelLoaded && loadedModelPath == configuredPath) {
            return
        }

        try {
            Log.d(TAG, "Loading segmentation model from: $configuredPath")
            val success = loadModel(configuredPath)
            if (success) {
                modelLoaded = true
                loadedModelPath = configuredPath
                Log.d(TAG, "✅ Segmentation model loaded successfully!")
            } else {
                Log.e(TAG, "❌ loadModel returned false")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to load model: $configuredPath", e)
        }
    }

    /**
     * Load the segmentation model
     */
    private external fun loadModel(modelPath: String): Boolean

    /**
     * Process I420 frame directly in native code - much faster than the old path.
     * Does segmentation and mask application in one JNI call.
     * @return Modified Y plane with background blacked out
     */
    private external fun processI420Frame(
        yData: ByteArray,
        uData: ByteArray,
        vData: ByteArray,
        width: Int,
        height: Int,
        yStride: Int,
        uvStride: Int,
        rotation: Int
    ): ByteArray?

    companion object {
        init {
            try {
                System.loadLibrary("react-native-executorch-webrtc")
            } catch (e: Exception) {
                Log.e("ExecutorchFrameProcessor", "Failed to load native library", e)
            }
        }
    }

    override fun process(frame: VideoFrame, helper: SurfaceTextureHelper): VideoFrame {
        frameCount++

        // Try to load model if not loaded yet (handles late configuration)
        if (!modelLoaded) {
            tryLoadModel()
        }

        // Log frame info every second
        val now = System.currentTimeMillis()
        if (now - lastLogTime >= 1000) {
            val buffer = frame.buffer
            Log.d(TAG, """
                ========== FRAME INFO ==========
                Frame count: $frameCount
                Size: ${buffer.width}x${buffer.height}
                Rotation: ${frame.rotation} degrees
                Buffer type: ${buffer.javaClass.simpleName}
                FPS: ${frameCount / ((now - lastLogTime) / 1000.0)}
                Background Removal: ACTIVE
                ================================
            """.trimIndent())

            lastLogTime = now
            frameCount = 0
        }

        // Apply background blur
        val blurredFrame = processWithModel(frame)

        if (blurredFrame != null) {
            lastProcessTime = now
            if (frameCount % 30 == 0) {
                Log.d(TAG, "Returning PROCESSED frame (rotation=${blurredFrame.rotation}, timestamp=${blurredFrame.timestampNs})")
            }
            // Return the blurred frame
            return blurredFrame
        }

        // Fallback: return original frame if processing failed
        if (frameCount % 30 == 0) {
            Log.w(TAG, "Returning ORIGINAL frame (processing returned null)")
        }
        frame.retain()
        return frame
    }

    private fun processWithModel(frame: VideoFrame): VideoFrame? {
        val i420Buffer = frame.buffer.toI420()
        if (i420Buffer == null) {
            Log.e(TAG, "Failed to convert frame buffer to I420!")
            return null
        }

        try {
            val width = i420Buffer.width
            val height = i420Buffer.height

            // Extract Y, U, V planes as byte arrays
            val yPlane = i420Buffer.dataY
            val uPlane = i420Buffer.dataU
            val vPlane = i420Buffer.dataV
            val yStride = i420Buffer.strideY
            val uStride = i420Buffer.strideU
            val vStride = i420Buffer.strideV

            // Calculate sizes - use minimum of calculated size and available bytes
            val uvHeight = height / 2
            val yCalcSize = yStride * height
            val uCalcSize = uStride * uvHeight
            val vCalcSize = vStride * uvHeight

            val yAvail = yPlane.remaining()
            val uAvail = uPlane.remaining()
            val vAvail = vPlane.remaining()

            val ySize = minOf(yCalcSize, yAvail)
            val uSize = minOf(uCalcSize, uAvail)
            val vSize = minOf(vCalcSize, vAvail)

            // Log buffer info occasionally for debugging
            if (frameCount % 60 == 0) {
                Log.d(TAG, "Buffer info: Y=$ySize/$yAvail (stride=$yStride), U=$uSize/$uAvail (stride=$uStride), V=$vSize/$vAvail (stride=$vStride), ${width}x${height}")
            }

            val yData = ByteArray(ySize)
            val uData = ByteArray(uSize)
            val vData = ByteArray(vSize)

            yPlane.get(yData)
            uPlane.get(uData)
            vPlane.get(vData)

            // Process in native - returns modified Y plane
            // Pass rotation so native code can rotate image before model inference
            val processedY = processI420Frame(yData, uData, vData, width, height, yStride, uStride, frame.rotation)

            if (processedY == null) {
                Log.e(TAG, "processI420Frame returned null!")
                i420Buffer.release()
                return null
            }

            // Calculate actual Y stride from returned data
            val actualYStride = processedY.size / height

            // Log success occasionally
            if (frameCount % 30 == 0) {
                Log.d(TAG, "Frame processed: ${width}x${height}, processedY=${processedY.size}, actualYStride=$actualYStride")
            }

            // Create output buffers
            // For Y: use processed data with calculated stride
            // For U/V: keep original data and strides (we don't modify chroma)
            val outYPlane = ByteBuffer.allocateDirect(processedY.size)
            val outUPlane = ByteBuffer.allocateDirect(uSize)
            val outVPlane = ByteBuffer.allocateDirect(vSize)

            outYPlane.put(processedY)
            outUPlane.put(uData)
            outVPlane.put(vData)

            outYPlane.rewind()
            outUPlane.rewind()
            outVPlane.rewind()

            // Use original U/V strides since we're passing through the original chroma data
            val resultBuffer = org.webrtc.JavaI420Buffer.wrap(
                width, height,
                outYPlane, actualYStride,
                outUPlane, uStride,
                outVPlane, vStride,
                null
            )

            i420Buffer.release()
            return VideoFrame(resultBuffer, frame.rotation, frame.timestampNs)
        } catch (e: Exception) {
            Log.e(TAG, "Exception in processWithModel: ${e.message}", e)
            i420Buffer.release()
            return null
        }
    }

}
