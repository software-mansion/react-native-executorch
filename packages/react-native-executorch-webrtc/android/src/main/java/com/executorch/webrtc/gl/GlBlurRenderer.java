package com.executorch.webrtc.gl;

import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class GlBlurRenderer {

    private static final String VERTEX_SHADER =
            "attribute vec4 aPosition;\n" +
            "attribute vec2 aTexCoord;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform mat4 uTexMatrix;\n" +
            "void main() {\n" +
            "  gl_Position = aPosition;\n" +
            "  vTexCoord = (uTexMatrix * vec4(aTexCoord, 0.0, 1.0)).xy;\n" +
            "}\n";

    private static final String VERTEX_SHADER_SIMPLE =
            "attribute vec4 aPosition;\n" +
            "attribute vec2 aTexCoord;\n" +
            "varying vec2 vTexCoord;\n" +
            "void main() {\n" +
            "  gl_Position = aPosition;\n" +
            "  vTexCoord = aTexCoord;\n" +
            "}\n";

    private static final String FRAGMENT_OES_TO_RGBA =
            "#extension GL_OES_EGL_image_external : require\n" +
            "precision mediump float;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform samplerExternalOES uTexture;\n" +
            "void main() { gl_FragColor = texture2D(uTexture, vTexCoord); }\n";

    private static final String FRAGMENT_PASSTHROUGH =
            "precision mediump float;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform sampler2D uTexture;\n" +
            "void main() { gl_FragColor = texture2D(uTexture, vTexCoord); }\n";

    private static final String FRAGMENT_BLUR =
            "precision mediump float;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform sampler2D uTexture;\n" +
            "uniform vec2 uDirection;\n" +
            "uniform float uWeights[9];\n" +
            "uniform float uOffsets[9];\n" +
            "void main() {\n" +
            "  vec4 color = texture2D(uTexture, vTexCoord) * uWeights[0];\n" +
            "  for (int i = 1; i < 9; i++) {\n" +
            "    vec2 off = uDirection * uOffsets[i];\n" +
            "    color += texture2D(uTexture, vTexCoord + off) * uWeights[i];\n" +
            "    color += texture2D(uTexture, vTexCoord - off) * uWeights[i];\n" +
            "  }\n" +
            "  gl_FragColor = color;\n" +
            "}\n";

    // Temporal smoothing shader - blends current mask with previous frame
    private static final String FRAGMENT_TEMPORAL_BLEND =
            "precision mediump float;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform sampler2D uCurrentMask;\n" +
            "uniform sampler2D uPreviousMask;\n" +
            "uniform float uBlendFactor;\n" +
            "void main() {\n" +
            "  float current = texture2D(uCurrentMask, vTexCoord).r;\n" +
            "  float previous = texture2D(uPreviousMask, vTexCoord).r;\n" +
            "  float blended = mix(previous, current, uBlendFactor);\n" +
            "  gl_FragColor = vec4(blended, blended, blended, 1.0);\n" +
            "}\n";

    private static final String FRAGMENT_COMPOSITE =
            "precision mediump float;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform sampler2D uOriginal;\n" +
            "uniform sampler2D uBlurred;\n" +
            "uniform sampler2D uMask;\n" +
            "uniform vec2 uMaskTexelSize;\n" +
            "void main() {\n" +
            "  vec4 original = texture2D(uOriginal, vTexCoord);\n" +
            "  vec4 blurred = texture2D(uBlurred, vTexCoord);\n" +
            "  // Sample mask with 3x3 blur for edge smoothing\n" +
            "  float mask = 0.0;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(-uMaskTexelSize.x, -uMaskTexelSize.y)).r * 0.0625;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(0.0, -uMaskTexelSize.y)).r * 0.125;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(uMaskTexelSize.x, -uMaskTexelSize.y)).r * 0.0625;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(-uMaskTexelSize.x, 0.0)).r * 0.125;\n" +
            "  mask += texture2D(uMask, vTexCoord).r * 0.25;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(uMaskTexelSize.x, 0.0)).r * 0.125;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(-uMaskTexelSize.x, uMaskTexelSize.y)).r * 0.0625;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(0.0, uMaskTexelSize.y)).r * 0.125;\n" +
            "  mask += texture2D(uMask, vTexCoord + vec2(uMaskTexelSize.x, uMaskTexelSize.y)).r * 0.0625;\n" +
            "  // Normalize from 0-255 byte range to 0-1\n" +
            "  mask = mask;\n" +
            "  // Apply smoothstep for better edge transition (0.2-0.8 range)\n" +
            "  mask = clamp((mask - 0.2) / 0.6, 0.0, 1.0);\n" +
            "  mask = mask * mask * (3.0 - 2.0 * mask);\n" +
            "  gl_FragColor = vec4(mix(blurred.rgb, original.rgb, mask), 1.0);\n" +
            "}\n";

    private static final int SEGMENTATION_WIDTH = 256;
    private static final int SEGMENTATION_HEIGHT = 256;
    private static final int BLUR_DOWNSCALE = 1;  // Full resolution for better quality
    private static final float TEMPORAL_BLEND_FACTOR = 0.6f;  // 0.6 = 60% new, 40% previous

    private final FullscreenQuad quad = new FullscreenQuad();

    private GlProgram oesProgram, rgbProgram, passthroughProgram, blurProgram, compositeProgram;
    private GlProgram temporalBlendProgram;
    private GlFramebuffer rgbaFbo, segmentationFbo, blurFboA, blurFboB, outputFbo;
    // Temporal smoothing: ping-pong between two mask FBOs
    private GlFramebuffer maskFboA, maskFboB;
    private int rawMaskTexture;  // Incoming mask before temporal smoothing
    private boolean useMaskFboA = true;  // Track which FBO has the "previous" mask
    private int currentWidth, currentHeight;
    private int currentMaskWidth, currentMaskHeight;
    private boolean initialized;

    private final float[] blurWeights = new float[9];
    private final float[] blurOffsets = new float[9];
    private ByteBuffer segPixelBuffer;

    public GlBlurRenderer() {
        computeGaussianKernel(16.0f);  // Increased sigma for stronger blur
    }

    public void ensureSetup(int width, int height) {
        if (initialized && width == currentWidth && height == currentHeight) return;
        if (initialized) releaseGlResources();

        currentWidth = width;
        currentHeight = height;

        oesProgram = new GlProgram(VERTEX_SHADER, FRAGMENT_OES_TO_RGBA);
        rgbProgram = new GlProgram(VERTEX_SHADER, FRAGMENT_PASSTHROUGH);
        passthroughProgram = new GlProgram(VERTEX_SHADER_SIMPLE, FRAGMENT_PASSTHROUGH);
        blurProgram = new GlProgram(VERTEX_SHADER_SIMPLE, FRAGMENT_BLUR);
        compositeProgram = new GlProgram(VERTEX_SHADER_SIMPLE, FRAGMENT_COMPOSITE);
        temporalBlendProgram = new GlProgram(VERTEX_SHADER_SIMPLE, FRAGMENT_TEMPORAL_BLEND);

        rgbaFbo = new GlFramebuffer(width, height);
        segmentationFbo = new GlFramebuffer(SEGMENTATION_WIDTH, SEGMENTATION_HEIGHT);

        int blurW = Math.max(1, width / BLUR_DOWNSCALE);
        int blurH = Math.max(1, height / BLUR_DOWNSCALE);
        blurFboA = new GlFramebuffer(blurW, blurH);
        blurFboB = new GlFramebuffer(blurW, blurH);
        outputFbo = new GlFramebuffer(width, height);

        // Temporal smoothing mask FBOs (will be sized on first mask upload)
        rawMaskTexture = GlFramebuffer.createTexture2D();
        maskFboA = null;
        maskFboB = null;
        currentMaskWidth = 0;
        currentMaskHeight = 0;
        useMaskFboA = true;
        initialized = true;
    }

    public void renderToRgbaFbo(int textureId, float[] transformMatrix, boolean isOes) {
        rgbaFbo.bind();
        GlProgram prog = isOes ? oesProgram : rgbProgram;
        prog.use();
        prog.setUniformMatrix4("uTexMatrix", transformMatrix);
        int target = isOes ? GLES11Ext.GL_TEXTURE_EXTERNAL_OES : GLES20.GL_TEXTURE_2D;
        prog.bindTexture("uTexture", 0, textureId, target);
        quad.draw(prog);
        GlFramebuffer.unbind();
    }

    public void renderDownscaled() {
        drawTexture(passthroughProgram, rgbaFbo.getTextureId(), segmentationFbo);
    }

    public ByteBuffer readSegmentationPixels() {
        int cap = SEGMENTATION_WIDTH * SEGMENTATION_HEIGHT * 4;
        if (segPixelBuffer == null || segPixelBuffer.capacity() < cap) {
            segPixelBuffer = ByteBuffer.allocateDirect(cap).order(ByteOrder.nativeOrder());
        }
        segPixelBuffer.clear();
        segmentationFbo.readPixels(segPixelBuffer);
        segPixelBuffer.rewind();
        return segPixelBuffer;
    }

    public void uploadMask(ByteBuffer maskData, int maskWidth, int maskHeight) {
        // Create/resize mask FBOs if needed
        if (maskFboA == null || currentMaskWidth != maskWidth || currentMaskHeight != maskHeight) {
            if (maskFboA != null) maskFboA.release();
            if (maskFboB != null) maskFboB.release();
            maskFboA = new GlFramebuffer(maskWidth, maskHeight);
            maskFboB = new GlFramebuffer(maskWidth, maskHeight);
            currentMaskWidth = maskWidth;
            currentMaskHeight = maskHeight;
            useMaskFboA = true;

            // Initialize both FBOs with the first mask (no blending on first frame)
            GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, rawMaskTexture);
            GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_LUMINANCE,
                    maskWidth, maskHeight, 0, GLES20.GL_LUMINANCE, GLES20.GL_UNSIGNED_BYTE, maskData);
            GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, 0);
            drawTexture(passthroughProgram, rawMaskTexture, maskFboA);
            drawTexture(passthroughProgram, rawMaskTexture, maskFboB);
            return;
        }

        // Upload raw mask to texture
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, rawMaskTexture);
        GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_LUMINANCE,
                maskWidth, maskHeight, 0, GLES20.GL_LUMINANCE, GLES20.GL_UNSIGNED_BYTE, maskData);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, 0);

        // Temporal blend: mix current mask with previous frame's mask
        GlFramebuffer previousFbo = useMaskFboA ? maskFboA : maskFboB;
        GlFramebuffer outputMaskFbo = useMaskFboA ? maskFboB : maskFboA;

        outputMaskFbo.bind();
        temporalBlendProgram.use();
        temporalBlendProgram.bindTexture("uCurrentMask", 0, rawMaskTexture, GLES20.GL_TEXTURE_2D);
        temporalBlendProgram.bindTexture("uPreviousMask", 1, previousFbo.getTextureId(), GLES20.GL_TEXTURE_2D);
        temporalBlendProgram.setUniform1f("uBlendFactor", TEMPORAL_BLEND_FACTOR);
        quad.draw(temporalBlendProgram);
        GlFramebuffer.unbind();

        // Flip for next frame
        useMaskFboA = !useMaskFboA;
    }

    public void renderBlur() {
        int blurW = blurFboA.getWidth();
        int blurH = blurFboA.getHeight();
        drawTexture(passthroughProgram, rgbaFbo.getTextureId(), blurFboA);
        // First pass: horizontal + vertical
        renderBlurPass(blurFboA.getTextureId(), blurFboB, 1.0f / blurW, 0.0f);
        renderBlurPass(blurFboB.getTextureId(), blurFboA, 0.0f, 1.0f / blurH);
        // Second pass: horizontal + vertical for stronger blur
        renderBlurPass(blurFboA.getTextureId(), blurFboB, 1.0f / blurW, 0.0f);
        renderBlurPass(blurFboB.getTextureId(), blurFboA, 0.0f, 1.0f / blurH);
    }

    public void renderComposite() {
        // Skip if mask hasn't been uploaded yet
        if (maskFboA == null || maskFboB == null) return;

        outputFbo.bind();
        compositeProgram.use();
        compositeProgram.bindTexture("uOriginal", 0, rgbaFbo.getTextureId(), GLES20.GL_TEXTURE_2D);
        compositeProgram.bindTexture("uBlurred", 1, blurFboA.getTextureId(), GLES20.GL_TEXTURE_2D);
        // Use the temporally smoothed mask (the one we just wrote to, which is now "previous")
        int smoothedMaskTexture = useMaskFboA ? maskFboB.getTextureId() : maskFboA.getTextureId();
        compositeProgram.bindTexture("uMask", 2, smoothedMaskTexture, GLES20.GL_TEXTURE_2D);
        // Set mask texel size for edge blur sampling (based on output resolution)
        compositeProgram.setUniform2f("uMaskTexelSize", 1.0f / currentWidth, 1.0f / currentHeight);
        quad.draw(compositeProgram);
        GlFramebuffer.unbind();
    }

    public int getOutputTextureId() { return outputFbo.getTextureId(); }
    public int getSegmentationWidth() { return SEGMENTATION_WIDTH; }
    public int getSegmentationHeight() { return SEGMENTATION_HEIGHT; }

    public void setBlurRadius(float sigma) {
        computeGaussianKernel(sigma);
    }

    public void release() {
        if (!initialized) return;
        releaseGlResources();
        segPixelBuffer = null;
        initialized = false;
    }

    private void renderBlurPass(int inputTex, GlFramebuffer outFbo, float dirX, float dirY) {
        outFbo.bind();
        blurProgram.use();
        blurProgram.bindTexture("uTexture", 0, inputTex, GLES20.GL_TEXTURE_2D);
        blurProgram.setUniform2f("uDirection", dirX, dirY);
        blurProgram.setUniform1fv("uWeights", blurWeights);
        blurProgram.setUniform1fv("uOffsets", blurOffsets);
        quad.draw(blurProgram);
        GlFramebuffer.unbind();
    }

    private void drawTexture(GlProgram prog, int textureId, GlFramebuffer outFbo) {
        outFbo.bind();
        prog.use();
        prog.bindTexture("uTexture", 0, textureId, GLES20.GL_TEXTURE_2D);
        quad.draw(prog);
        GlFramebuffer.unbind();
    }

    private void computeGaussianKernel(float sigma) {
        float sum = 0;
        for (int i = 0; i < 9; i++) {
            blurOffsets[i] = i;
            blurWeights[i] = (float) (Math.exp(-(i * i) / (2.0 * sigma * sigma))
                    / (Math.sqrt(2.0 * Math.PI) * sigma));
            sum += (i == 0) ? blurWeights[i] : 2.0f * blurWeights[i];
        }
        for (int i = 0; i < 9; i++) blurWeights[i] /= sum;
    }

    private void releaseGlResources() {
        if (rgbaFbo != null) rgbaFbo.release();
        if (segmentationFbo != null) segmentationFbo.release();
        if (blurFboA != null) blurFboA.release();
        if (blurFboB != null) blurFboB.release();
        if (outputFbo != null) outputFbo.release();
        if (maskFboA != null) maskFboA.release();
        if (maskFboB != null) maskFboB.release();
        GLES20.glDeleteTextures(1, new int[]{rawMaskTexture}, 0);
        if (oesProgram != null) oesProgram.release();
        if (rgbProgram != null) rgbProgram.release();
        if (passthroughProgram != null) passthroughProgram.release();
        if (blurProgram != null) blurProgram.release();
        if (compositeProgram != null) compositeProgram.release();
        if (temporalBlendProgram != null) temporalBlendProgram.release();
    }
}
