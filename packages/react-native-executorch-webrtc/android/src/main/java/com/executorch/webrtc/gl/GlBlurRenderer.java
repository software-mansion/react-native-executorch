package com.executorch.webrtc.gl;

import android.opengl.GLES11Ext;
import android.opengl.GLES20;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * OpenGL-based blur renderer for WebRTC video frames.
 * Handles texture conversion, downscaling for segmentation, Gaussian blur, and compositing.
 * Simplified version matching fishjam's implementation - temporal smoothing is now
 * handled by MaskPostProcessor on CPU instead of GPU shaders.
 */
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
            "void main() {\n" +
            "  gl_FragColor = texture2D(uTexture, vTexCoord);\n" +
            "}\n";

    private static final String FRAGMENT_PASSTHROUGH =
            "precision mediump float;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform sampler2D uTexture;\n" +
            "void main() {\n" +
            "  gl_FragColor = texture2D(uTexture, vTexCoord);\n" +
            "}\n";

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

    private static final String FRAGMENT_COMPOSITE =
            "precision mediump float;\n" +
            "varying vec2 vTexCoord;\n" +
            "uniform sampler2D uOriginal;\n" +
            "uniform sampler2D uBlurred;\n" +
            "uniform sampler2D uMask;\n" +
            "void main() {\n" +
            "  vec4 original = texture2D(uOriginal, vTexCoord);\n" +
            "  vec4 blurred = texture2D(uBlurred, vTexCoord);\n" +
            "  float mask = texture2D(uMask, vTexCoord).r;\n" +
            "  gl_FragColor = vec4(mix(blurred.rgb, original.rgb, mask), 1.0);\n" +
            "}\n";

    private static final int SEGMENTATION_WIDTH = 256;
    private static final int SEGMENTATION_HEIGHT = 144;
    private static final int BLUR_DOWNSCALE = 1;  // Full resolution for better quality

    private final FullscreenQuad quad = new FullscreenQuad();

    private GlProgram oesProgram;
    private GlProgram rgbProgram;
    private GlProgram passthroughProgram;
    private GlProgram blurProgram;
    private GlProgram compositeProgram;

    private GlFramebuffer rgbaFramebuffer;
    private GlFramebuffer segmentationFramebuffer;
    private GlFramebuffer blurFramebufferA;
    private GlFramebuffer blurFramebufferB;
    private GlFramebuffer outputFramebuffer;

    private int maskTexture;

    private int currentWidth;
    private int currentHeight;
    private boolean initialized;

    private final float[] blurWeights = new float[9];
    private final float[] blurOffsets = new float[9];

    private ByteBuffer segPixelBuffer;

    public GlBlurRenderer() {
        computeGaussianKernel(12.0f);
    }

    public void ensureSetup(int width, int height) {
        if (initialized && width == currentWidth && height == currentHeight) {
            return;
        }

        if (initialized) {
            releaseGlResources();
        }

        currentWidth = width;
        currentHeight = height;

        oesProgram = new GlProgram(VERTEX_SHADER, FRAGMENT_OES_TO_RGBA);
        rgbProgram = new GlProgram(VERTEX_SHADER, FRAGMENT_PASSTHROUGH);
        passthroughProgram = new GlProgram(VERTEX_SHADER_SIMPLE, FRAGMENT_PASSTHROUGH);
        blurProgram = new GlProgram(VERTEX_SHADER_SIMPLE, FRAGMENT_BLUR);
        compositeProgram = new GlProgram(VERTEX_SHADER_SIMPLE, FRAGMENT_COMPOSITE);

        rgbaFramebuffer = new GlFramebuffer(width, height);
        segmentationFramebuffer = new GlFramebuffer(SEGMENTATION_WIDTH, SEGMENTATION_HEIGHT);

        int blurWidth = Math.max(1, width / BLUR_DOWNSCALE);
        int blurHeight = Math.max(1, height / BLUR_DOWNSCALE);
        blurFramebufferA = new GlFramebuffer(blurWidth, blurHeight);
        blurFramebufferB = new GlFramebuffer(blurWidth, blurHeight);
        outputFramebuffer = new GlFramebuffer(width, height);

        maskTexture = GlFramebuffer.createTexture2D();

        initialized = true;
    }

    public void renderToRgbaFbo(int textureId, float[] transformMatrix, boolean isOes) {
        rgbaFramebuffer.bind();
        GlProgram program = isOes ? oesProgram : rgbProgram;
        program.use();
        program.setUniformMatrix4("uTexMatrix", transformMatrix);
        int target = isOes ? GLES11Ext.GL_TEXTURE_EXTERNAL_OES : GLES20.GL_TEXTURE_2D;
        program.bindTexture("uTexture", 0, textureId, target);
        quad.draw(program);
        GlFramebuffer.unbind();
    }

    public void renderDownscaled() {
        drawTexture(passthroughProgram, rgbaFramebuffer.getTextureId(), segmentationFramebuffer);
    }

    public ByteBuffer readSegmentationPixels() {
        int requiredCapacity = SEGMENTATION_WIDTH * SEGMENTATION_HEIGHT * 4;
        if (segPixelBuffer == null || segPixelBuffer.capacity() < requiredCapacity) {
            segPixelBuffer = ByteBuffer.allocateDirect(requiredCapacity);
            segPixelBuffer.order(ByteOrder.nativeOrder());
        }
        segPixelBuffer.clear();
        segmentationFramebuffer.readPixels(segPixelBuffer);
        segPixelBuffer.rewind();
        return segPixelBuffer;
    }

    public void uploadMask(ByteBuffer maskData, int maskWidth, int maskHeight) {
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, maskTexture);
        GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_LUMINANCE,
                maskWidth, maskHeight, 0,
                GLES20.GL_LUMINANCE, GLES20.GL_UNSIGNED_BYTE, maskData);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, 0);
    }

    public void renderBlur() {
        int blurWidth = blurFramebufferA.getWidth();
        int blurHeight = blurFramebufferA.getHeight();
        drawTexture(passthroughProgram, rgbaFramebuffer.getTextureId(), blurFramebufferA);

        // First blur pass (horizontal + vertical)
        renderBlurPass(blurFramebufferA.getTextureId(), blurFramebufferB, 1.0f / blurWidth, 0.0f);
        renderBlurPass(blurFramebufferB.getTextureId(), blurFramebufferA, 0.0f, 1.0f / blurHeight);

        // Second blur pass for stronger effect
        renderBlurPass(blurFramebufferA.getTextureId(), blurFramebufferB, 1.0f / blurWidth, 0.0f);
        renderBlurPass(blurFramebufferB.getTextureId(), blurFramebufferA, 0.0f, 1.0f / blurHeight);
    }

    public void renderComposite() {
        outputFramebuffer.bind();
        compositeProgram.use();
        compositeProgram.bindTexture("uOriginal", 0, rgbaFramebuffer.getTextureId(), GLES20.GL_TEXTURE_2D);
        compositeProgram.bindTexture("uBlurred", 1, blurFramebufferA.getTextureId(), GLES20.GL_TEXTURE_2D);
        compositeProgram.bindTexture("uMask", 2, maskTexture, GLES20.GL_TEXTURE_2D);
        quad.draw(compositeProgram);
        GlFramebuffer.unbind();
    }

    public int getOutputTextureId() {
        return outputFramebuffer.getTextureId();
    }

    public int getSegmentationWidth() {
        return SEGMENTATION_WIDTH;
    }

    public int getSegmentationHeight() {
        return SEGMENTATION_HEIGHT;
    }

    public void release() {
        if (!initialized) {
            return;
        }
        releaseGlResources();
        segPixelBuffer = null;
        initialized = false;
    }

    private void renderBlurPass(int inputTexture, GlFramebuffer outputFbo, float dirX, float dirY) {
        outputFbo.bind();
        blurProgram.use();
        blurProgram.bindTexture("uTexture", 0, inputTexture, GLES20.GL_TEXTURE_2D);
        blurProgram.setUniform2f("uDirection", dirX, dirY);
        blurProgram.setUniform1fv("uWeights", blurWeights);
        blurProgram.setUniform1fv("uOffsets", blurOffsets);
        quad.draw(blurProgram);
        GlFramebuffer.unbind();
    }

    private void drawTexture(GlProgram program, int textureId, GlFramebuffer outputFbo) {
        outputFbo.bind();
        program.use();
        program.bindTexture("uTexture", 0, textureId, GLES20.GL_TEXTURE_2D);
        quad.draw(program);
        GlFramebuffer.unbind();
    }

    public void setBlurRadius(float sigma) {
        computeGaussianKernel(sigma);
    }

    private void computeGaussianKernel(float sigma) {
        float sum = 0;
        for (int i = 0; i < 9; i++) {
            blurOffsets[i] = (float) i;
            blurWeights[i] = (float) (Math.exp(-(i * i) / (2.0 * sigma * sigma))
                    / (Math.sqrt(2.0 * Math.PI) * sigma));
            sum += (i == 0) ? blurWeights[i] : 2.0f * blurWeights[i];
        }
        for (int i = 0; i < 9; i++) {
            blurWeights[i] /= sum;
        }
    }

    private void releaseGlResources() {
        if (rgbaFramebuffer != null) rgbaFramebuffer.release();
        if (segmentationFramebuffer != null) segmentationFramebuffer.release();
        if (blurFramebufferA != null) blurFramebufferA.release();
        if (blurFramebufferB != null) blurFramebufferB.release();
        if (outputFramebuffer != null) outputFramebuffer.release();

        int[] textures = {maskTexture};
        GLES20.glDeleteTextures(1, textures, 0);
        maskTexture = 0;

        if (oesProgram != null) oesProgram.release();
        if (rgbProgram != null) rgbProgram.release();
        if (passthroughProgram != null) passthroughProgram.release();
        if (blurProgram != null) blurProgram.release();
        if (compositeProgram != null) compositeProgram.release();

        rgbaFramebuffer = null;
        segmentationFramebuffer = null;
        blurFramebufferA = null;
        blurFramebufferB = null;
        outputFramebuffer = null;
        oesProgram = null;
        rgbProgram = null;
        passthroughProgram = null;
        blurProgram = null;
        compositeProgram = null;
    }
}
