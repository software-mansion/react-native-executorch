package com.executorch.webrtc;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * Post-processes segmentation masks for temporal stability.
 * Applies morphological cleaning and EMA temporal smoothing.
 * Gaussian blur is handled on GPU for better performance.
 */
public class MaskPostProcessor {

    private static final float BINARIZE_THRESHOLD = 0.5f;
    private static final float EMA_ALPHA = 0.5f;  // 50% history for responsive mask

    private float[] smoothedMask;
    private float[] tempA;
    private float[] rawFloatMask;
    private int maskWidth;
    private int maskHeight;
    private boolean hasHistory;

    private ByteBuffer outputBuffer;
    private int outputBufferCapacity;

    public MaskPostProcessor() {
    }

    /**
     * Process a byte mask (0-255) from ExecuTorch segmentation.
     * Returns processed mask as ByteBuffer ready for GPU upload.
     * Note: Gaussian blur is done on GPU after upload for better performance.
     */
    public ByteBuffer process(byte[] rawMask, int w, int h) {
        ensureBuffers(w, h);
        int len = w * h;

        // Convert byte mask (0-255) to float mask (0-1)
        for (int i = 0; i < len; i++) {
            rawFloatMask[i] = (rawMask[i] & 0xFF) / 255.0f;
        }

        // Apply morphological cleaning (binarize + erode + dilate) to remove noise
        morphologicalClean(rawFloatMask, tempA, w, h);

        // Apply EMA temporal smoothing (keeps soft values, no hard threshold)
        applyEmaSmoothing(tempA, len);

        // Convert to bytes for GPU upload (blur will be done on GPU)
        convertMaskToBytes(smoothedMask, len);

        return outputBuffer;
    }

    public void reset() {
        hasHistory = false;
    }

    private void ensureBuffers(int w, int h) {
        if (w != maskWidth || h != maskHeight) {
            int len = w * h;
            smoothedMask = new float[len];
            tempA = new float[len];
            rawFloatMask = new float[len];
            maskWidth = w;
            maskHeight = h;
            hasHistory = false;
        }

        int requiredCapacity = w * h;
        if (outputBuffer == null || outputBufferCapacity < requiredCapacity) {
            outputBuffer = ByteBuffer.allocateDirect(requiredCapacity);
            outputBuffer.order(ByteOrder.nativeOrder());
            outputBufferCapacity = requiredCapacity;
        }
    }

    private static void binarizeInPlace(float[] mask, int len) {
        for (int i = 0; i < len; i++) {
            mask[i] = mask[i] > BINARIZE_THRESHOLD ? 1.0f : 0.0f;
        }
    }

    private void morphologicalClean(float[] src, float[] dst, int w, int h) {
        int len = w * h;
        binarizeInPlace(src, len);
        erode(src, dst, w, h);
        dilate(dst, src, w, h);
        System.arraycopy(src, 0, dst, 0, len);
    }

    private void erode(float[] src, float[] dst, int w, int h) {
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                float min = 1.0f;
                for (int dy = -1; dy <= 1; dy++) {
                    int ny = y + dy;
                    if (ny < 0 || ny >= h) {
                        min = 0.0f;
                        continue;
                    }
                    for (int dx = -1; dx <= 1; dx++) {
                        int nx = x + dx;
                        if (nx < 0 || nx >= w) {
                            min = 0.0f;
                            continue;
                        }
                        float v = src[ny * w + nx];
                        if (v < min) {
                            min = v;
                        }
                    }
                }
                dst[y * w + x] = min;
            }
        }
    }

    private void dilate(float[] src, float[] dst, int w, int h) {
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                float max = 0.0f;
                for (int dy = -1; dy <= 1; dy++) {
                    int ny = y + dy;
                    if (ny < 0 || ny >= h) continue;
                    for (int dx = -1; dx <= 1; dx++) {
                        int nx = x + dx;
                        if (nx < 0 || nx >= w) continue;
                        float v = src[ny * w + nx];
                        if (v > max) max = v;
                    }
                }
                dst[y * w + x] = max;
            }
        }
    }

    private void applyEmaSmoothing(float[] current, int len) {
        float oneMinusAlpha = 1.0f - EMA_ALPHA;
        if (!hasHistory) {
            System.arraycopy(current, 0, smoothedMask, 0, len);
            hasHistory = true;
        } else {
            for (int i = 0; i < len; i++) {
                smoothedMask[i] = EMA_ALPHA * smoothedMask[i] + oneMinusAlpha * current[i];
            }
        }
    }

    private void convertMaskToBytes(float[] source, int length) {
        outputBuffer.clear();
        for (int i = 0; i < length; i++) {
            float value = source[i];
            if (value < 0f) {
                value = 0f;
            } else if (value > 1f) {
                value = 1f;
            }
            outputBuffer.put((byte) (value * 255f));
        }
        outputBuffer.rewind();
    }
}
